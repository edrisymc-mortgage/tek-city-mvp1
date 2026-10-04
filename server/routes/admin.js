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

  // ------------------------------------------------------------ Community Fund (records only)
  // None of these move money. Transfers and spending are signed through the external multisig; these routes
  // record and verify them on chain. Spending also requires COMMUNITY_FUND_ENABLED and an active written program.
  const cr = require("../chain/creatorRewards");
  const { normalizeAddress } = require("../auth/address");
  r.get("/community/overview", wrap(async (req, res) => {
    const [ev, al, led, pr, sp] = await Promise.all([
      db.query(`SELECT id, source_event_id, source_transaction_signature, asset_mint, reward_amount_base_units::text AS amount, verification_status, rejection_reason, received_at FROM creator_reward_events ORDER BY id DESC LIMIT 100`),
      db.query(`SELECT id, creator_reward_event_id, asset_mint, community_fund_amount_base_units::text AS community, operator_retained_amount_base_units::text AS operator, status, community_transfer_signature FROM creator_reward_allocations ORDER BY id DESC LIMIT 100`),
      db.query(`SELECT asset_mint, status, SUM(allocated_amount_base_units)::text AS n FROM community_fund_ledger GROUP BY asset_mint, status`),
      db.query(`SELECT * FROM community_programs ORDER BY id DESC`),
      db.query(`SELECT * FROM community_fund_spends ORDER BY id DESC LIMIT 100`),
    ]);
    await log(req, "community.viewed", {});
    res.json({ config: { enabled: config.communityFund.enabled, operatorWallet: config.communityFund.operatorWallet || null, treasuryWallet: config.communityFund.treasuryWallet || null, bps: config.communityFund.communityBps, errors: config.communityFund.errors }, events: ev.rows, allocations: al.rows, ledger: led.rows, programs: pr.rows, spends: sp.rows });
  }));
  r.post("/community/rescan", wrap(async (req, res) => {
    const b = v.obj(req.body, { signature: { type: "string", min: 64, max: 100, pattern: /^[1-9A-HJ-NP-Za-km-z]+$/ } });
    const out = await cr.processSignature(b.signature);
    await log(req, "community.rescan", { signature: b.signature, out });
    res.json(out);
  }));
  r.post("/community/allocations/:id/approve", wrap(async (req, res) => {
    const id = v.obj({ id: Number(req.params.id) }, { id: { type: "int", min: 1, max: 1e12 } }).id;
    const out = await cr.approveAllocation(id);
    await log(req, "community.allocation_approved", { id, ok: out.ok });
    res.json(out);
  }));
  r.post("/community/allocations/:id/verify-transfer", wrap(async (req, res) => {
    const id = v.obj({ id: Number(req.params.id) }, { id: { type: "int", min: 1, max: 1e12 } }).id;
    const b = v.obj(req.body, { signature: { type: "string", min: 64, max: 100, pattern: /^[1-9A-HJ-NP-Za-km-z]+$/ } });
    const out = await cr.verifyTransfer(id, b.signature);
    await log(req, "community.transfer_verified", { id, signature: b.signature, ok: out.ok, code: out.code });
    if (!out.ok) fail(409, out.code, out.message);
    res.json(out);
  }));
  r.post("/community/events/:id/reverse", wrap(async (req, res) => {
    const id = v.obj({ id: Number(req.params.id) }, { id: { type: "int", min: 1, max: 1e12 } }).id;
    const b = v.obj(req.body, { reason: { type: "string", min: 5, max: 200 } });
    const out = await cr.reverseEvent(id, b.reason);
    await log(req, "community.event_reversed", { id, reason: b.reason, ok: out.ok });
    if (!out.ok) fail(409, out.code, "Can't reverse this event.");
    res.json(out);
  }));
  r.post("/community/programs", wrap(async (req, res) => {
    const b = v.obj(req.body, {
      name: { type: "string", min: 3, max: 120 },
      category: { type: "enum", values: ["education", "contest", "creator_support", "event", "bug_bounty", "board_participation"] },
      description: { type: "string", min: 20, max: 4000 },
      eligibilityRules: { type: "string", min: 20, max: 4000 },
      abusePrevention: { type: "string", min: 20, max: 4000 },
      paymentMethod: { type: "string", min: 5, max: 400 },
      assetMint: { type: "string", min: 3, max: 44 },
      budgetBaseUnits: { type: "string", min: 1, max: 30, pattern: /^[1-9][0-9]*$/ },
      startsAt: { type: "string", min: 10, max: 40 },
      endsAt: { type: "string", min: 10, max: 40 },
      policyUrl: { type: "string", min: 12, max: 500, pattern: /^https:\/\/[^\s<>"]+$/ },
    });
    const st = new Date(b.startsAt), en = new Date(b.endsAt);
    if (!(st.getTime() > 0) || !(en > st)) fail(400, "bad_dates", "endsAt must be after startsAt.");
    const row = (await db.query(`INSERT INTO community_programs (name, category, description, eligibility_rules, abuse_prevention, payment_method, asset_mint, budget_base_units, starts_at, ends_at, policy_url, created_by_wallet)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`, [b.name, b.category, b.description, b.eligibilityRules, b.abusePrevention, b.paymentMethod, b.assetMint, b.budgetBaseUnits, st, en, b.policyUrl, req.admin.wallet])).rows[0];
    await log(req, "community.program_created", { id: row.id, name: b.name });
    res.json({ id: row.id, status: "draft" });
  }));
  r.post("/community/programs/:id/status", wrap(async (req, res) => {
    const id = v.obj({ id: Number(req.params.id) }, { id: { type: "int", min: 1, max: 1e12 } }).id;
    const b = v.obj(req.body, { status: { type: "enum", values: ["active", "closed"] } });
    const r2 = await db.query(`UPDATE community_programs SET status = $2, updated_at = now() WHERE id = $1 RETURNING id`, [id, b.status]);
    if (!r2.rowCount) fail(404, "not_found", "Program not found.");
    await log(req, "community.program_status", { id, status: b.status });
    res.json({ ok: true });
  }));
  // Record a spend the multisig already signed. Verified on chain: treasury -> recipient, finalized, within budget and dates.
  r.post("/community/spends", wrap(async (req, res) => {
    if (!config.communityFund.enabled) fail(403, "fund_disabled", "The Community Fund is disabled (COMMUNITY_FUND_ENABLED=false).");
    const b = v.obj(req.body, {
      programId: { type: "int", min: 1, max: 1e12 },
      recipient: { type: "string", min: 32, max: 44 },
      amountBaseUnits: { type: "string", min: 1, max: 30, pattern: /^[1-9][0-9]*$/ },
      signature: { type: "string", min: 64, max: 100, pattern: /^[1-9A-HJ-NP-Za-km-z]+$/ },
      reason: { type: "string", min: 5, max: 400 },
    });
    const recipient = normalizeAddress(b.recipient);
    if (!recipient) fail(400, "bad_address", "Invalid recipient.");
    const out = await recordSpend({ ...b, recipient, by: req.admin.wallet });
    await log(req, "community.spend_recorded", { programId: b.programId, signature: b.signature, ok: out.ok, code: out.code });
    if (!out.ok) fail(409, out.code, out.message);
    res.json(out);
  }));
  async function recordSpend({ programId, recipient, amountBaseUnits, signature, reason, by }) {
    const p = (await db.query(`SELECT * FROM community_programs WHERE id = $1`, [programId])).rows[0];
    if (!p || p.status !== "active") return { ok: false, code: "no_program", message: "Spending needs an active, documented program." };
    const now = new Date();
    if (now < new Date(p.starts_at) || now > new Date(p.ends_at)) return { ok: false, code: "outside_dates", message: "Program is outside its start/end dates." };
    const spent = BigInt((await db.query(`SELECT COALESCE(SUM(amount_base_units),0)::text AS n FROM community_fund_spends WHERE program_id = $1 AND status = 'confirmed'`, [programId])).rows[0].n);
    const amt = BigInt(amountBaseUnits);
    if (spent + amt > BigInt(p.budget_base_units)) return { ok: false, code: "over_budget", message: "That would exceed the program budget." };
    const used = (await db.query(`SELECT 1 FROM community_fund_spends WHERE multisig_tx_signature = $1 UNION SELECT 1 FROM creator_reward_allocations WHERE community_transfer_signature = $1`, [signature])).rowCount;
    if (used) return { ok: false, code: "signature_used", message: "That transaction is already recorded." };
    const v2 = await cr.verifyMovement(signature, config.communityFund.treasuryWallet, recipient, p.asset_mint, amt);
    if (!v2.ok) return v2;
    await db.query(`INSERT INTO community_fund_spends (program_id, recipient_wallet, asset_mint, amount_base_units, multisig_tx_signature, verification_slot, reason, recorded_by_wallet) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [programId, recipient, p.asset_mint, amt.toString(), signature, v2.slot, reason, by]);
    return { ok: true };
  }

  return r;
}

module.exports = { build };
