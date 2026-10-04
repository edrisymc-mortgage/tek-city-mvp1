"use strict";
// Builds the Express app + Socket.IO server. Separated from index.js so tests can boot it in-process.
const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const db = require("./db/pool");
const { migrate } = require("./db/migrate");
const util = require("./security/util");
const sec = require("./security/http");
const sessions = require("./auth/sessions");
const engine = require("./game/engine");
const state = require("./game/state");
const { limiter, POLICIES } = require("./security/rateLimit");

async function createApp(config, opts = {}) {
  util.setSecret(config.sessionSecret);
  sessions.configure(config);
  engine.configure(config);
  state.configure(config);
  require("./chain/solana").configure(config);
  require("./chain/pump").configure(config);
  require("./chain/rewards").configure(config);
  require("./chain/creatorRewards").configure(config);
  require("./chain/fundOps").configure(config);
  for (const e of config.communityFund.errors) console.warn(`[community-fund] ${e}`);
  require("./game/spins").configure(config);
  require("./game/milestones").configure(config);
  const { mode } = await db.init(config, opts.db || {});
  await migrate(config);
  await engine.ensureOpenRound();

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxy);
  app.use(sec.httpsOnly(config));
  app.use(sec.securityHeaders(config));
  app.use(sec.permissionsPolicy);
  app.use(sec.cors(config));
  app.use(sec.noStoreApi);

  app.get("/health", async (_req, res) => {
    try {
      const r = await db.query(`SELECT round_key, ends_at FROM game_rounds WHERE status = 'open' ORDER BY id DESC LIMIT 1`);
      const behind = r.rows[0] ? Date.now() - new Date(r.rows[0].ends_at).getTime() : null;
      res.json({
        status: behind !== null && behind > 120e3 ? "degraded" : "ok",
        version: require("../package.json").version,
        db: mode === "external" ? "connected" : "embedded-nonpersistent",
        persistent: mode === "external",
        sessionsPersistent: !config.sessionSecretEphemeral,
        round: r.rows[0] ? r.rows[0].round_key : null,
        uptime: Math.round(process.uptime()),
      });
    } catch {
      res.status(503).json({ status: "down" });
    }
  });

  app.use("/api/launchpad/launch", express.json({ limit: "3mb", strict: true }));
  app.use("/api", express.json({ limit: "10kb", strict: true }));
  app.use(sessions.loadSession);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: (origin, cb) => cb(null, !origin || config.allowedOrigins.has(origin)), credentials: true },
    serveClient: false,
    maxHttpBufferSize: 1e4,
    allowRequest: (req, cb) => {
      const origin = req.headers.origin;
      if (origin && !config.allowedOrigins.has(origin)) return cb("origin", false);
      const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
      const p = POLICIES.socket_connect;
      cb(null, limiter.take("socket_connect", util.hmac(ip, "ip"), p.max, p.windowMs).ok);
    },
  });
  // Server -> client only. Incoming client events are ignored.
  let pending = null;
  const notify = () => {
    if (pending) return;
    pending = setTimeout(async () => {
      pending = null;
      try { const s = await state.cityState(); io.emit("city", { version: s.version, round: s.round && s.round.key }); } catch { /* ignore */ }
    }, 400);
  };
  io.on("connection", (socket) => {
    socket.onAny(() => {}); // ignore all client events
    state.cityState().then((s) => socket.emit("city", { version: s.version, round: s.round && s.round.key })).catch(() => {});
  });

  app.use("/api/admin", require("./routes/admin").build(config, { notify }));
  app.use("/api", require("./routes/pump").build(config));
  app.use("/api", require("./routes/launchpad").build(config, { notify, noScheduler: !!opts.noScheduler }));
  app.use("/api", require("./routes/api").build(config, { notify }));
  app.use("/api", (_req, res) => res.status(404).json({ error: { code: "not_found", message: "Not found." } }));

  const pub = path.join(__dirname, "..", "public");
  app.use(express.static(pub, {
    extensions: ["html"], index: "index.html", dotfiles: "ignore",
    setHeaders: (res, file) => {
      if (/\/assets\/(fonts|img)\//.test(file)) res.setHeader("Cache-Control", "public, max-age=604800");
      else if (/\.(js|css)$/.test(file)) res.setHeader("Cache-Control", "public, max-age=300");
      else res.setHeader("Cache-Control", "no-cache");
    },
  }));
  app.use((_req, res) => res.status(404).sendFile(path.join(pub, "404.html")));
  app.use(sec.errorHandler(config));

  // Round scheduler: the server closes and settles rounds on the wall clock.
  let ticking = false;
  const tick = async () => {
    if (ticking) return;
    ticking = true;
    try { const s = await engine.settleDue(new Date()); if (s) { notify(); console.log(`[tick] settled ${s.round} -> ${s.next}`); } }
    catch (e) { console.error("[tick] settlement error:", e.code || "", String(e.message).slice(0, 200)); }
    finally { ticking = false; }
  };
  const timer = opts.noScheduler ? null : setInterval(tick, config.game.tickCheckMs);
  const sweeper = setInterval(() => {
    limiter.sweep();
    db.query(`DELETE FROM wallet_login_nonces WHERE expires_at < now() - interval '1 day'`).catch(() => {});
    db.query(`DELETE FROM sessions WHERE expires_at < now() - interval '7 days'`).catch(() => {});
  }, 10 * 60e3);
  sweeper.unref();
  // Background jobs. None of them can move funds: the server holds no signing keys.
  //  - milestones: refresh TEK CITY market cap, grant gameplay-only bonus spins
  //  - creator rewards: detect finalized creator rewards received by OPERATOR_CREATOR_REWARD_WALLET and
  //    write the 20/80 accounting records (idempotent). Community Fund transfers happen only via the external multisig.
  const rewardsTimer = opts.noScheduler || !config.launchpad.enabled ? null : setInterval(() => {
    require("./game/milestones").tick().then(() => notify()).catch((e) => console.error("[milestones]", String(e.message).slice(0, 160)));
    require("./chain/creatorRewards").tick().catch((e) => console.error("[creator-rewards]", String(e.message).slice(0, 160)));
  }, 5 * 60e3);
  if (rewardsTimer) rewardsTimer.unref();
  // One-tap fund ops (claim / 20% sweep / player payouts): follow sent transactions to finalization, close finished
  // leaderboard days. Still no keys: these only read Solana and update records.
  const fundTimer = opts.noScheduler || !config.launchpad.enabled ? null : setInterval(() => {
    require("./chain/fundOps").tick().catch((e) => console.error("[fund-ops]", String(e.message).slice(0, 160)));
  }, 30e3);
  if (fundTimer) fundTimer.unref();
  if (!opts.noScheduler) require("./chain/fundOps").ensureOfficialCoin().catch((e) => console.error("[fund-ops] official coin", String(e.message).slice(0, 160)));

  async function close() {
    if (timer) clearInterval(timer);
    clearInterval(sweeper);
    if (rewardsTimer) clearInterval(rewardsTimer);
    if (fundTimer) clearInterval(fundTimer);
    io.close();
    await new Promise((r) => server.close(() => r()));
    await db.close();
  }

  return { app, server, io, close, tick, notify, dbMode: mode };
}

module.exports = { createApp };
