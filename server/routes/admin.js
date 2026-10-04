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

  // ------------------------------------------------------------ Community Fund (records only, RBAC)
  // None of these move money. Transfers and payments are signed by a human through the external multisig; these
  // routes record and verify them on chain. Each route needs a specific role from admin_roles (ADMIN_WALLET_ROLES).
  const cr = require("../chain/creatorRewards");
  const { normalizeAddress } = require("../auth/address");
  const ID = { id: { type: "int", min: 1, max: 1e12 } };
  const idOf = (req) => v.obj({ id: Number(req.params.id) }, ID).id;
  const AMOUNT = { type: "string", min: 1, max: 30, pattern: /^[1-9][0-9]*$/ };
  const SIG = { type: "string", min: 64, max: 100, pattern: /^[1-9A-HJ-NP-Za-km-z]+$/ };
  const ASSET = { type: "string", min: 3, max: 44, pattern: /^(SOL|[1-9A-HJ-NP-Za-km-z]{32,44})$/ };
  const policyVersion = async () => ((await cr.policies())["community_fund_model"] || {}).version || "unversioned";
  async function rolesOf(wallet) { return (await db.query(`SELECT role FROM admin_roles WHERE address = $1`, [wallet])).rows.map((x) => x.role); }
  const role = (...need) => wrap(async (req, _res, next) => {
    const have = await rolesOf(req.admin.wallet);
    if (!need.some((x) => have.includes(x))) {
      await log(req, "community.denied", { path: req.path, need });
      fail(403, "missing_role", `This action needs the ${need.join(" or ")} role.`);
    }
    req.admin.roles = have;
    next();
  });
  const anyRole = role("coin_approver", "policy_admin", "program_admin", "grant_approver", "ledger_reconciler");
  const done = async (req, res, action, out, details) => {
    await log(req, action, { ...details, ok: out.ok !== false, code: out.code });
    if (out.ok === false) fail(409, out.code || "rejected", out.message || out.code || "Rejected.");
    res.json(out);
  };

  r.get("/community/overview", anyRole, wrap(async (req, res) => {
    const q = (sql) => db.query(sql).then((x) => x.rows);
    const [coins, events, allocations, ledger, programs, grants] = await Promise.all([
      q(`SELECT * FROM operator_coins ORDER BY id DESC`),
      q(`SELECT id, operator_coin_id, source_type, source_event_id, source_transaction_signature, asset_mint, reward_amount_base_units::text AS amount, received_slot, received_at, verification_status, rejection_reason FROM creator_reward_events ORDER BY id DESC LIMIT 200`),
      q(`SELECT id, creator_reward_event_id, asset_mint, community_fund_amount_base_units::text AS community, operator_retained_amount_base_units::text AS operator, allocation_status, community_transfer_signature, transfer_verified_at FROM creator_reward_allocations ORDER BY id DESC LIMIT 200`),
      q(`SELECT asset_mint, status, SUM(allocated_amount_base_units)::text AS n FROM community_fund_ledger GROUP BY asset_mint, status`),
      q(`SELECT *, budget_base_units::text AS budget_base_units FROM community_reward_programs ORDER BY id DESC`),
      q(`SELECT *, award_amount_base_units::text AS award_amount_base_units FROM community_reward_grants ORDER BY id DESC LIMIT 200`),
    ]);
    await log(req, "community.viewed", {});
    const f = config.communityFund;
    res.json({ roles: req.admin.roles, config: { enabled: f.enabled, paused: f.paused, operatorWallet: f.operatorWallet || null, treasuryWallet: f.treasuryWallet || null, bps: { community: f.communityBps, operator: f.operatorBps }, errors: f.errors, network: config.solana.network }, coins, events, allocations, ledger, programs, grants });
  }));

  // Operator coins: only coins TEK CITY itself operates. Players' coins never go here.
  r.post("/community/coins", role("coin_approver"), wrap(async (req, res) => {
    const b = v.obj(req.body, {
      mint: { type: "string", min: 32, max: 44, pattern: /^[1-9A-HJ-NP-Za-km-z]+$/ },
      tokenName: { type: "string", min: 1, max: 60 },
      tokenSymbol: { type: "string", min: 1, max: 12 },
      launchVenue: { type: "enum", values: ["pump.fun", "pumpswap"] },
    });
    const mint = normalizeAddress(b.mint);
    if (!mint) fail(400, "bad_address", "Invalid mint address.");
    const f = config.communityFund;
    if (!f.operatorWallet) fail(409, "not_configured", "OPERATOR_CREATOR_REWARD_WALLET is not configured.");
    if ([f.operatorWallet, f.treasuryWallet].includes(mint)) fail(400, "bad_address", "A wallet address is not a coin mint.");
    const row = (await db.query(`INSERT INTO operator_coins (mint_address_or_launch_id, token_name, token_symbol, launch_venue, network, operator_reward_wallet, policy_version, configured_by_admin_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (mint_address_or_launch_id) DO NOTHING RETURNING id`, [mint, b.tokenName, b.tokenSymbol, b.launchVenue, config.solana.network, f.operatorWallet, await policyVersion(), req.admin.wallet])).rows[0];
    if (!row) fail(409, "duplicate", "That coin is already recorded.");
    await log(req, "community.coin_created", { id: row.id, mint, status: "draft" });
    res.json({ id: row.id, status: "draft" });
  }));
  const COIN_FLOW = { draft: ["approved", "retired"], approved: ["active", "retired"], active: ["paused", "retired"], paused: ["active", "retired"], retired: [] };
  r.post("/community/coins/:id/status", role("coin_approver"), wrap(async (req, res) => {
    const id = idOf(req);
    const b = v.obj(req.body, { status: { type: "enum", values: ["approved", "active", "paused", "retired"] } });
    const c = (await db.query(`SELECT * FROM operator_coins WHERE id = $1`, [id])).rows[0];
    if (!c) fail(404, "not_found", "Coin not found.");
    if (!COIN_FLOW[c.eligibility_status].includes(b.status)) fail(409, "bad_transition", `Can't go from ${c.eligibility_status} to ${b.status}.`);
    if (c.operator_reward_wallet !== config.communityFund.operatorWallet && b.status === "active") fail(409, "wallet_mismatch", "This coin was recorded for a different operator wallet.");
    await db.query(`UPDATE operator_coins SET eligibility_status = $2, configured_by_admin_id = $3, configured_at = now() WHERE id = $1`, [id, b.status, req.admin.wallet]);
    await log(req, "community.coin_status", { id, from: c.eligibility_status, to: b.status });
    res.json({ ok: true });
  }));

  // Ledger reconciliation.
  r.post("/community/rescan", role("ledger_reconciler"), wrap(async (req, res) => {
    const b = v.obj(req.body || {}, { signature: { ...SIG, optional: true } });
    const out = b.signature ? await cr.processSignature(b.signature, { actor: req.admin.wallet }) : (await cr.tick(), { ok: true });
    await done(req, res, "community.rescan", out, { signature: b.signature });
  }));
  r.post("/community/events/:id/match", role("ledger_reconciler"), wrap(async (req, res) => {
    const id = idOf(req); const b = v.obj(req.body, { operatorCoinId: ID.id });
    await done(req, res, "community.event_match", await cr.matchEvent(id, b.operatorCoinId, req.admin.wallet), { id, coin: b.operatorCoinId });
  }));
  r.post("/community/events/:id/reverse", role("ledger_reconciler"), wrap(async (req, res) => {
    const id = idOf(req); const b = v.obj(req.body, { reason: { type: "string", min: 5, max: 200 } });
    await done(req, res, "community.event_reverse", await cr.reverseEvent(id, b.reason, req.admin.wallet), { id, reason: b.reason });
  }));
  r.post("/community/allocations/:id/propose-transfer", role("ledger_reconciler"), wrap(async (req, res) => {
    const id = idOf(req); v.obj(req.body || {}, {});
    await done(req, res, "community.transfer_propose", await cr.proposeTransfer(id, req.admin.wallet), { id });
  }));
  r.post("/community/allocations/:id/verify-transfer", role("ledger_reconciler"), wrap(async (req, res) => {
    const id = idOf(req); const b = v.obj(req.body, { signature: SIG });
    await done(req, res, "community.transfer_verify", await cr.verifyTransfer(id, b.signature, req.admin.wallet), { id, signature: b.signature });
  }));

  // Policy text (versioned, append-only).
  r.post("/community/policies", role("policy_admin"), wrap(async (req, res) => {
    const b = v.obj(req.body, {
      key: { type: "enum", values: ["client_launch_disclosure", "community_fund_disclosure", "community_fund_model", "token_utility_disclosure"] },
      version: { type: "string", min: 4, max: 40, pattern: /^[0-9A-Za-z._-]+$/ },
      body: { type: "string", min: 20, max: 4000 },
    });
    const row = await db.query(`INSERT INTO policy_versions (key, version, body) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING RETURNING key`, [b.key, b.version, b.body]);
    if (!row.rowCount) fail(409, "duplicate", "That version already exists. Policy versions can't be edited; add a new one.");
    await log(req, "community.policy_added", { key: b.key, version: b.version });
    res.json({ ok: true });
  }));

  // Programs.
  r.post("/community/programs", role("program_admin"), wrap(async (req, res) => {
    const b = v.obj(req.body, {
      name: { type: "string", min: 3, max: 120 },
      purpose: { type: "enum", values: ["onboarding", "education", "gameplay_contest", "creator_support", "event", "bug_bounty", "board_incentive", "other"] },
      description: { type: "string", min: 20, max: 4000 },
      eligibilityRules: { type: "string", min: 20, max: 4000 },
      fraudControls: { type: "string", min: 20, max: 4000 },
      assetMint: ASSET,
      budgetBaseUnits: AMOUNT,
      startsAt: { type: "string", min: 10, max: 40 },
      endsAt: { type: "string", min: 10, max: 40 },
    });
    const st = new Date(b.startsAt), en = new Date(b.endsAt);
    if (!(st.getTime() > 0) || !(en > st)) fail(400, "bad_dates", "endsAt must be after startsAt.");
    const row = (await db.query(`INSERT INTO community_reward_programs (name, description, purpose, eligibility_rules, fraud_controls, asset_mint, budget_base_units, starts_at, ends_at, policy_version, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`, [b.name, b.description, b.purpose, b.eligibilityRules, b.fraudControls, b.assetMint, b.budgetBaseUnits, st, en, await policyVersion(), req.admin.wallet])).rows[0];
    await log(req, "community.program_created", { id: row.id, name: b.name });
    res.json({ id: row.id, status: "draft" });
  }));
  r.post("/community/programs/:id/status", role("program_admin"), wrap(async (req, res) => {
    const id = idOf(req);
    const b = v.obj(req.body, { status: { type: "enum", values: ["proposed", "approved", "active", "paused", "completed", "cancelled"] } });
    await done(req, res, "community.program_status", await cr.setProgramStatus(id, b.status, req.admin.wallet), { id, status: b.status });
  }));

  // Grants.
  r.post("/community/grants", role("program_admin", "grant_approver"), wrap(async (req, res) => {
    const b = v.obj(req.body, {
      programId: ID.id,
      recipient: { type: "string", min: 32, max: 44 },
      amountBaseUnits: AMOUNT,
      proof: { type: "string", min: 5, max: 400 },
    });
    const recipient = normalizeAddress(b.recipient);
    if (!recipient) fail(400, "bad_address", "Invalid recipient.");
    const f = config.communityFund;
    if ([f.operatorWallet, f.treasuryWallet].includes(recipient)) fail(400, "bad_address", "Grants can't go to TEK CITY wallets.");
    await done(req, res, "community.grant_create", await cr.createGrant({ programId: b.programId, recipient, amount: b.amountBaseUnits, proof: b.proof }, req.admin.wallet), { programId: b.programId, recipient });
  }));
  r.post("/community/grants/:id/status", role("grant_approver"), wrap(async (req, res) => {
    const id = idOf(req);
    const b = v.obj(req.body, { status: { type: "enum", values: ["approved", "payment_proposed", "rejected", "reversed"] } });
    await done(req, res, "community.grant_status", await cr.setGrantStatus(id, b.status, req.admin.wallet), { id, status: b.status });
  }));
  r.post("/community/grants/:id/verify-payment", role("grant_approver"), wrap(async (req, res) => {
    const id = idOf(req); const b = v.obj(req.body, { signature: SIG });
    await done(req, res, "community.grant_verify", await cr.verifyGrantPayment(id, b.signature, req.admin.wallet), { id, signature: b.signature });
  }));

  return r;
}

module.exports = { build };
