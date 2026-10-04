"use strict";
// Admin API. Disabled (404) unless ADMIN_WALLET_ALLOWLIST is configured. Requires a wallet session for an
// allowlisted address AND a fresh signature (re-auth) within the last 10 minutes. Every action is audited.
// There is deliberately no funds, treasury, or transfer control here.
const express = require("express");
const db = require("../db/pool");
const flags = require("../flags");
const engine = require("../game/engine");
const sessions = require("../auth/sessions");
const { limit } = require("../security/rateLimit");
const v = require("../security/validate");
const { fail, ipHash } = require("../security/util");
const { audit, activity } = require("../audit");
const { wrap } = require("./api");

function build(config, { notify }) {
  const r = express.Router();

  r.use(wrap(async (req, _res, next) => {
    const count = (await db.query(`SELECT count(*)::int AS n FROM admin_wallets`)).rows[0].n;
    if (!count) fail(404, "not_found", "Not found.");
    next();
  }));
  r.use(limit("admin", (req) => `ip:${ipHash(req)}`));
  r.use(sessions.csrf);
  r.use(wrap(async (req, _res, next) => {
    const s = req.session;
    if (!s || s.auth_method !== "wallet" || !s.wallet_address) fail(401, "admin_auth", "Sign in with an admin wallet.");
    const ok = (await db.query(`SELECT 1 FROM admin_wallets WHERE address = $1`, [s.wallet_address])).rowCount;
    if (!ok) {
      await audit(null, { actorUserId: s.user_id, actorWallet: s.wallet_address, action: "admin.denied", target: req.path, ipHash: ipHash(req) });
      fail(403, "not_admin", "This wallet is not on the admin allowlist.");
    }
    sessions.requireRecentWalletAuth(req);
    req.admin = { wallet: s.wallet_address, userId: s.user_id };
    next();
  }));
  const log = (req, action, details) => audit(null, { actorUserId: req.admin.userId, actorWallet: req.admin.wallet, action: `admin.${action}`, details, ipHash: ipHash(req) });

  r.get("/overview", wrap(async (req, res) => {
    const [cs, rounds, users, actions, abuse, f, sup] = await Promise.all([
      db.query(`SELECT paused, paused_reason, stability, day, day_status, version FROM city_state WHERE id = 1`),
      db.query(`SELECT round_key, status, starts_at, ends_at, settled_at, settlement FROM game_rounds ORDER BY id DESC LIMIT 8`),
      db.query(`SELECT kind, count(*)::int AS n FROM users GROUP BY kind`),
      db.query(`SELECT action_type, count(*)::int AS n FROM player_actions WHERE created_at > now() - interval '1 hour' GROUP BY action_type`),
      db.query(`SELECT count(*)::int AS n FROM abuse_flags WHERE status = 'open'`),
      flags.all(true),
      db.query(`SELECT count(*)::int AS n FROM support_reports WHERE status = 'new'`),
    ]);
    await log(req, "viewed_overview", {});
    res.json({ city: cs.rows[0], rounds: rounds.rows, users: users.rows, actionsLastHour: actions.rows, openAbuseFlags: abuse.rows[0].n, flags: Object.values(f), newSupport: sup.rows[0].n, dbMode: db.getMode() });
  }));

  r.post("/pause", wrap(async (req, res) => {
    const b = v.obj(req.body, { paused: { type: "bool" }, reason: { type: "string", max: 140, optional: true } });
    await db.query(`UPDATE city_state SET paused = $1, paused_reason = $2, version = version + 1 WHERE id = 1`, [b.paused, b.reason || null]);
    await log(req, b.paused ? "paused" : "resumed", { reason: b.reason || null });
    await activity(null, "admin", b.paused ? `The city is paused: ${b.reason || "maintenance"}.` : "The city is open again.");
    notify();
    res.json({ ok: true });
  }));

  r.post("/settle", wrap(async (req, res) => {
    const summary = await engine.settleDue(new Date(), { force: true, by: `admin:${req.admin.wallet.slice(0, 6)}` });
    await log(req, "manual_settle", { round: summary && summary.round });
    notify();
    res.json({ ok: true, summary });
  }));

  r.post("/flags", wrap(async (req, res) => {
    const b = v.obj(req.body, { key: { type: "string", max: 40 }, enabled: { type: "bool" } });
    const out = await db.tx((c) => flags.set(c, b.key, b.enabled, req.admin.wallet));
    await log(req, "flag_changed", out);
    res.json({ ok: true, flag: out });
  }));

  r.get("/abuse", wrap(async (req, res) => {
    const rows = (await db.query(`SELECT id, user_id, wallet, reason, details, status, created_at FROM abuse_flags ORDER BY id DESC LIMIT 100`)).rows;
    await log(req, "viewed_abuse", {});
    res.json({ flags: rows });
  }));

  r.post("/abuse/:id", wrap(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) fail(400, "bad_request", "Bad id.");
    const b = v.obj(req.body, { status: { type: "enum", values: ["reviewed", "dismissed"] }, ban: { type: "bool", optional: true } });
    const row = (await db.query(`UPDATE abuse_flags SET status = $2, reviewed_by = $3 WHERE id = $1 RETURNING user_id`, [id, b.status, req.admin.wallet])).rows[0];
    if (!row) fail(404, "not_found", "Flag not found.");
    if (b.ban && row.user_id) {
      await db.query(`UPDATE users SET is_banned = true WHERE id = $1`, [row.user_id]);
      await db.query(`UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL`, [row.user_id]);
    }
    await log(req, "abuse_reviewed", { id, status: b.status, ban: !!b.ban });
    res.json({ ok: true });
  }));

  r.get("/audit", wrap(async (req, res) => {
    const lim = Math.min(500, Math.max(1, Number(req.query.limit) || 100));
    const action = typeof req.query.action === "string" && /^[a-z._]{1,40}$/.test(req.query.action) ? req.query.action : null;
    const rows = (await db.query(
      `SELECT id, at, actor_user_id, actor_wallet, action, target, details FROM audit_logs ${action ? "WHERE action LIKE $2 || '%'" : ""} ORDER BY id DESC LIMIT $1`,
      action ? [lim, action] : [lim])).rows;
    res.json({ entries: rows });
  }));

  r.get("/support", wrap(async (req, res) => {
    const rows = (await db.query(`SELECT id, kind, email, subject, body, url, status, created_at FROM support_reports ORDER BY id DESC LIMIT 100`)).rows;
    await log(req, "viewed_support", {});
    res.json({ reports: rows });
  }));

  r.post("/events", wrap(async (req, res) => {
    const b = v.obj(req.body, { title: { type: "string", min: 3, max: 80 }, body: { type: "string", min: 3, max: 400 } });
    const round = await engine.getOpenRound(db);
    await db.query(`INSERT INTO city_events (round_id, kind, code, title, body, status, created_by) VALUES ($1,'admin','announcement',$2,$3,'resolved',$4)`,
      [round ? round.id : null, b.title, b.body, req.admin.wallet]);
    await activity(null, "admin", `${b.title}: ${b.body}`);
    await log(req, "event_created", { title: b.title });
    notify();
    res.json({ ok: true });
  }));

  r.post("/cosmetics", wrap(async (req, res) => {
    const b = v.obj(req.body, {
      id: { type: "string", min: 3, max: 40, pattern: /^[a-z0-9-]+$/ },
      name: { type: "string", min: 2, max: 40 }, description: { type: "string", min: 3, max: 200 }, enabled: { type: "bool", optional: true },
    });
    await db.query(`INSERT INTO cosmetics (id, name, description, enabled) VALUES ($1,$2,$3,$4)
                    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, enabled = EXCLUDED.enabled`,
      [b.id, b.name, b.description, b.enabled !== false]);
    await log(req, "cosmetic_saved", { id: b.id });
    res.json({ ok: true });
  }));

  // JSON backup of game data (no sessions, nonces, or hashes).
  r.get("/export", wrap(async (req, res) => {
    const { exportData } = require("../../scripts/backup");
    const data = await exportData(db);
    await log(req, "exported_backup", { tables: Object.keys(data.tables).length });
    res.setHeader("Content-Disposition", `attachment; filename="tekcity-backup-${new Date().toISOString().slice(0, 10)}.json"`);
    res.json(data);
  }));

  return r;
}

module.exports = { build };
