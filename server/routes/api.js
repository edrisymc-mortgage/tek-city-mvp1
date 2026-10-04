"use strict";
const express = require("express");
const db = require("../db/pool");
const flags = require("../flags");
const engine = require("../game/engine");
const state = require("../game/state");
const siws = require("../auth/siws");
const sessions = require("../auth/sessions");
const { normalizeAddress, shortAddress } = require("../auth/address");
const { limit, check: rateCheck } = require("../security/rateLimit");
const v = require("../security/validate");
const { fail, ipHash, randomToken } = require("../security/util");
const { audit, activity, flagAbuse } = require("../audit");
const spins = require("../game/spins");
const rewards = require("../chain/rewards");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const ipKey = (req) => `ip:${ipHash(req)}`;
const userKey = (req) => (req.session && req.session.user_id ? `u:${req.session.user_id}` : null);

function build(config, { notify }) {
  const r = express.Router();

  // ------------------------------------------------------------ public read
  r.get("/config", limit("api_read", ipKey), wrap(async (_req, res) => {
    const f = await flags.all();
    res.json({
      beta: true,
      appUrl: config.appUrl,
      solanaNetwork: config.solana.network,
      features: { walletConnect: !!(f.wallet_connect && f.wallet_connect.enabled), marketData: !!(f.market_data && f.market_data.enabled), onchainActions: false },
      official: {
        domain: config.appUrl ? new URL(config.appUrl).host : null,
        x: config.official.x || null, discord: config.official.discord || null, telegram: config.official.telegram || null,
        tokenMint: normalizeAddress(config.officialTokenMint) || null,
        auditStatus: config.official.auditStatus || "No audit has been performed. TEK CITY has no deployed token or smart contract in this beta.",
        supportEmail: config.official.supportEmail || null,
      },
    });
  }));

  r.get("/session", limit("session", ipKey), wrap(async (req, res) => {
    const s = await sessions.ensureSession(req, res);
    res.json({ csrf: s.csrf_token, me: await state.me(s) });
  }));

  r.get("/state", limit("api_read", ipKey), wrap(async (_req, res) => res.json(await state.cityState())));
  r.get("/leaderboard", limit("leaderboard", ipKey), wrap(async (_req, res) => res.json((await state.cityState()).leaderboard)));
  r.get("/me", limit("api_read", ipKey), wrap(async (req, res) => res.json(await state.me(req.session))));

  // Everything below changes state: Origin + CSRF checks.
  r.use(sessions.csrf);

  // ------------------------------------------------------------ guest
  r.post("/guest", limit("guest_create", ipKey), wrap(async (req, res) => {
    const { name } = v.obj(req.body, { name: { type: "string", min: 2, max: 20, pattern: v.NAME } });
    if (req.session && req.session.user_id) fail(409, "already_signed_in", "You're already playing. Sign out first to start a new guest.");
    const ih = ipHash(req);
    const cap = Number((await db.query(`SELECT value FROM app_settings WHERE key = 'max_guest_accounts_per_ip_per_day'`)).rows[0]?.value ?? 10);
    const recent = (await db.query(`SELECT count(*)::int AS n FROM audit_logs WHERE action = 'auth.guest_created' AND ip_hash = $1 AND at > now() - interval '1 day'`, [ih])).rows[0].n;
    if (recent >= cap) {
      await flagAbuse(null, { ipHash: ih, reason: "guest_cap", details: { recent } });
      fail(429, "guest_cap", "Too many new guest players from this network today. Please continue with an existing session.");
    }
    await db.tx(async (c) => {
      const u = (await c.query(`INSERT INTO users (display_name, kind) VALUES ($1, 'guest') RETURNING id`, [name])).rows[0];
      await engine.ensurePlayer(c, u.id);
      await sessions.createSession(c, req, res, { userId: u.id, method: "guest" });
      await audit(c, { actorUserId: u.id, action: "auth.guest_created", ipHash: ih });
      await activity(c, "join", `${name} arrived in TEK CITY.`);
    });
    notify();
    res.json({ ok: true, csrf: req.session.csrf_token, me: await state.me(req.session) });
  }));

  // ------------------------------------------------------------ wallet sign-in (signature only)
  r.post("/auth/nonce", limit("auth_nonce", ipKey), wrap(async (req, res) => {
    if (!(await flags.enabled("wallet_connect"))) fail(403, "feature_disabled", "Wallet sign-in is turned off right now. You can still play as a guest.");
    const body = v.obj(req.body, { address: { type: "string", min: 32, max: 44 }, purpose: { type: "enum", values: ["login", "reauth"], optional: true } });
    const purpose = body.purpose || "login";
    const address = normalizeAddress(body.address);
    if (!address) fail(400, "bad_address", "That is not a valid Solana wallet address.");
    if (purpose === "reauth" && !(req.session && req.session.auth_method === "wallet" && req.session.wallet_address === address)) {
      fail(401, "wallet_session_required", "Sign in with this wallet first.");
    }
    const n = await db.tx(async (c) => {
      const out = await siws.issueNonce(c, config, req, address, purpose, req.session.id_hash);
      await audit(c, { actorUserId: req.session.user_id, actorWallet: address, action: "auth.nonce_created", details: { purpose }, ipHash: ipHash(req) });
      return out;
    });
    res.json(n);
  }));

  r.post("/auth/verify", limit("auth_verify_ip", ipKey), wrap(async (req, res, next) => {
    if (!(await flags.enabled("wallet_connect"))) fail(403, "feature_disabled", "Wallet sign-in is turned off right now.");
    const body = v.obj(req.body, {
      address: { type: "string", min: 32, max: 44 },
      nonce: { type: "string", min: 32, max: 32 },
      signature: { type: "string", min: 64, max: 120 },
      purpose: { type: "enum", values: ["login", "reauth"], optional: true },
    });
    const address = normalizeAddress(body.address);
    if (!address) fail(400, "bad_address", "That is not a valid Solana wallet address.");
    // per-wallet verify limit
    rateCheck("auth_verify_wallet", `w:${address}`, req);
    const purpose = body.purpose || "login";
    const ih = ipHash(req);

    const out = await db.tx(async (c) => {
      const check = await siws.consumeAndVerify(c, { nonce: body.nonce, address, signature: body.signature, purpose, sessionIdHash: req.session.id_hash });
      await audit(c, { actorUserId: req.session.user_id, actorWallet: address, action: check.ok ? "auth.nonce_consumed" : "auth.login_failed", details: { purpose, reason: check.ok ? null : check.reason }, ipHash: ih });
      if (!check.ok) return { ok: false, reason: check.reason };

      if (purpose === "reauth") {
        if (!(req.session.auth_method === "wallet" && req.session.wallet_address === address)) return { ok: false, reason: "session_mismatch" };
        await c.query(`UPDATE sessions SET reauth_at = now() WHERE id_hash = $1`, [req.session.id_hash]);
        await audit(c, { actorUserId: req.session.user_id, actorWallet: address, action: "auth.reauth", ipHash: ih });
        return { ok: true, reauth: true };
      }

      let userId;
      const existing = (await c.query(`SELECT user_id FROM wallet_accounts WHERE address = $1 AND unlinked_at IS NULL FOR UPDATE`, [address])).rows[0];
      if (existing) {
        userId = existing.user_id;
        const banned = (await c.query(`SELECT is_banned FROM users WHERE id = $1`, [userId])).rows[0];
        if (banned && banned.is_banned) return { ok: false, reason: "banned" };
        await c.query(`UPDATE wallet_accounts SET last_login_at = now() WHERE address = $1`, [address]);
      } else {
        const maxWallets = Number((await c.query(`SELECT value FROM app_settings WHERE key = 'max_wallets_per_account'`)).rows[0]?.value ?? 1);
        const cur = req.session.user_id;
        let linkToGuest = false;
        if (cur && req.session.auth_method === "guest") {
          const n = (await c.query(`SELECT count(*)::int AS n FROM wallet_accounts WHERE user_id = $1 AND unlinked_at IS NULL`, [cur])).rows[0].n;
          linkToGuest = n < maxWallets;
        }
        if (linkToGuest) {
          userId = cur;
          await c.query(`UPDATE users SET kind = 'wallet' WHERE id = $1`, [userId]);
        } else {
          userId = (await c.query(`INSERT INTO users (display_name, kind) VALUES ($1, 'wallet') RETURNING id`, [`Builder-${address.slice(0, 4)}`])).rows[0].id;
          await engine.ensurePlayer(c, userId);
        }
        // UNIQUE(address) enforces one account per wallet even under races.
        await c.query(`INSERT INTO wallet_accounts (user_id, address, network) VALUES ($1,$2,$3)`, [userId, address, config.solana.network]);
        await audit(c, { actorUserId: userId, actorWallet: address, action: "wallet.linked", details: { upgradedGuest: linkToGuest }, ipHash: ih });
      }
      await engine.grantBadge(c, userId, "verified-builder");
      await sessions.createSession(c, req, res, { userId, method: "wallet", wallet: address, reauth: true });
      await audit(c, { actorUserId: userId, actorWallet: address, action: "wallet.connected", ipHash: ih });
      return { ok: true };
    });

    if (!out.ok) {
      const fails = (await db.query(`SELECT count(*)::int AS n FROM audit_logs WHERE action = 'auth.login_failed' AND (actor_wallet = $1 OR ip_hash = $2) AND at > now() - interval '1 hour'`, [address, ih])).rows[0].n;
      if (fails >= 5) await flagAbuse(null, { wallet: address, ipHash: ih, reason: "signature_failures", details: { fails } });
      const msg = {
        nonce_expired: "That sign-in request expired. Please try again.",
        nonce_reused: "That sign-in request was already used. Please try again.",
        banned: "This account is suspended. Contact support if you think this is a mistake.",
      }[out.reason] || "We couldn't verify that signature. Please try again.";
      return next(new (require("../security/util").UserError)(401, "verify_failed", msg));
    }
    notify();
    res.json({ ok: true, reauth: !!out.reauth, csrf: req.session.csrf_token, me: await state.me(req.session) });
  }));

  r.post("/auth/logout", limit("session", ipKey), wrap(async (req, res) => {
    if (req.session) await audit(null, { actorUserId: req.session.user_id, actorWallet: req.session.wallet_address, action: req.session.auth_method === "wallet" ? "wallet.disconnected" : "auth.logout", ipHash: ipHash(req) });
    await sessions.revoke(req, res);
    const s = await sessions.ensureSession(req, res);
    res.json({ ok: true, csrf: s.csrf_token, me: { signedIn: false } });
  }));

  // ------------------------------------------------------------ profile + tutorial
  r.post("/profile", sessions.requireUser, limit("game_action_user", userKey), wrap(async (req, res) => {
    const { name } = v.obj(req.body, { name: { type: "string", min: 2, max: 20, pattern: v.NAME } });
    await db.query(`UPDATE users SET display_name = $2 WHERE id = $1`, [req.session.user_id, name]);
    await audit(null, { actorUserId: req.session.user_id, action: "profile.renamed", ipHash: ipHash(req) });
    req.session.display_name = name;
    res.json({ ok: true, me: await state.me(req.session) });
  }));

  r.post("/tutorial", sessions.requireUser, limit("game_action_user", userKey), wrap(async (req, res) => {
    const { done } = v.obj(req.body, { done: { type: "bool" } });
    await db.query(`UPDATE player_resources SET tutorial_done = $2 WHERE user_id = $1`, [req.session.user_id, done]);
    res.json({ ok: true });
  }));

  // ------------------------------------------------------------ game actions (server decides everything)
  const SHAPES = {
    checkin: {},
    move: {},
    contribute: { districtId: { type: "int", min: 0, max: 23 }, amount: { type: "int", min: 10, max: 200 } },
    vote: { option: { type: "int", min: 0, max: 3 } },
  };
  r.post("/action/:type", sessions.requireUser, limit("game_action_ip", ipKey), limit("game_action_user", userKey), wrap(async (req, res) => {
    const type = req.params.type;
    if (!SHAPES[type]) fail(404, "bad_action", "Unknown action.");
    const payload = v.obj(req.body || {}, SHAPES[type]);
    const key = v.idempotencyKey(req);
    let spin = type === "move" ? await spins.requireSpin(req.session.user_id) : null;
    if (!spin && type === "move" && config.launchpad.enabled) spin = { perRound: true, earned: Number.MAX_SAFE_INTEGER, wallet: null };
    if ((spins.enabled() || config.launchpad.enabled) && (type === "checkin" || type === "contribute")) fail(410, "removed", "Game credits are gone. Launch or grow coins on the space you land on.");
    const result = await engine.performAction(req.session.user_id, type, payload, key, { ipHash: ipHash(req), spin });
    if (result.jackpot && !result.replayed && spin && spin.wallet) {
      result.jackpotWin = await rewards.jackpot({ userId: req.session.user_id, wallet: spin.wallet, name: req.session.display_name, roundId: null }).catch(() => ({ lamports: 0 }));
    }
    notify();
    res.json(result);
  }));

  // ------------------------------------------------------------ support + scam reports
  r.post("/support", limit("support", ipKey), wrap(async (req, res) => {
    const b = v.obj(req.body, {
      kind: { type: "enum", values: ["contact", "scam"] },
      email: { type: "string", max: 200, optional: true, pattern: /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/ },
      subject: { type: "string", min: 3, max: 120 },
      body: { type: "string", min: 10, max: 4000 },
      url: { type: "string", max: 500, optional: true },
    });
    if (/\b(seed|recovery)\s+phrase\b.*(\b\w+\b\s+){11,}/i.test(b.body)) {
      fail(400, "looks_like_secret", "It looks like you pasted a recovery phrase. Never share it with anyone, including us. Remove it and resubmit.");
    }
    await db.query(`INSERT INTO support_reports (kind, email, subject, body, url, ip_hash) VALUES ($1,$2,$3,$4,$5,$6)`,
      [b.kind, b.email || null, b.subject, b.body, b.url || null, ipHash(req)]);
    await audit(null, { actorUserId: req.session.user_id, action: `support.${b.kind}`, ipHash: ipHash(req) });
    res.json({ ok: true, message: b.kind === "scam" ? "Thank you. Our team will review this report." : "Thanks, we received your message." });
  }));

  // Future read-only market data: disabled in this beta.
  r.get("/market", limit("api_read", ipKey), wrap(async (_req, _res) => {
    if (!(await flags.enabled("market_data"))) fail(404, "feature_disabled", "Market data is not available in this beta.");
    fail(501, "not_implemented", "Market data is not implemented yet.");
  }));

  return r;
}

module.exports = { build, wrap, randomToken, shortAddress };
