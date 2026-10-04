"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { boot, wallet, walletLogin } = require("./helpers");
const db = require("../server/db/pool");
const engine = require("../server/game/engine");
const { limiter } = require("../server/security/rateLimit");
const { STOPS } = require("../server/game/board");

let T;
const ADMIN = wallet();
test.before(async () => { T = await boot({ ADMIN_WALLET_ALLOWLIST: ADMIN.address }); });
test.after(async () => { await T.close(); });
test.beforeEach(() => limiter.reset());

async function ledgerConsistent(userId) {
  const p = (await db.query(`SELECT * FROM player_resources WHERE user_id = $1`, [userId])).rows[0];
  const l = (await db.query(`SELECT resource, sum(delta)::int AS s FROM resource_ledger WHERE user_id = $1 GROUP BY resource`, [userId])).rows;
  const sum = Object.fromEntries(l.map((r) => [r.resource, r.s]));
  return { p, credits: 100 + (sum.build_credits || 0), influence: sum.influence || 0 };
}
const uid = async (name) => (await db.query(`SELECT id FROM users WHERE display_name = $1 ORDER BY created_at DESC LIMIT 1`, [name])).rows[0].id;

test("check-in is once per round and rewards are decided by the server", async () => {
  const c = T.client(); await c.guest("Checker");
  const a = await c.action("checkin");
  assert.equal(a.status, 200, JSON.stringify(a.body));
  assert.ok(a.body.gained.build_credits >= 15);
  const b = await c.action("checkin");
  assert.equal(b.status, 409);
  assert.match(b.body.error.message, /already checked in/i);
  const me = (await c.get("/api/me")).body;
  assert.equal(me.can.checkin, "Already checked in this round.");
});

test("move: server rolls, spends energy, cannot be replayed into extra moves", async () => {
  const c = T.client(); await c.guest("Mover");
  const m = await c.action("move", {}, "k-move-fixed-01");
  assert.equal(m.status, 200);
  assert.ok(m.body.roll >= 1 && m.body.roll <= 6);
  assert.equal(m.body.to, m.body.roll % STOPS.length);
  const replay = await c.action("move", {}, "k-move-fixed-01");
  assert.equal(replay.status, 200);
  assert.equal(replay.body.replayed, true);
  assert.equal(replay.body.roll, m.body.roll, "replay returns the original result");
  const second = await c.action("move");
  assert.equal(second.status, 409);
  const p = (await db.query(`SELECT energy, position FROM player_resources WHERE user_id = $1`, [await uid("Mover")])).rows[0];
  assert.equal(p.position, m.body.to);
});

test("idempotency key cannot be reused for a different action", async () => {
  const c = T.client(); await c.guest("Idem");
  assert.equal((await c.action("checkin", {}, "k-same-000001")).status, 200);
  const r = await c.action("vote", { option: 0 }, "k-same-000001");
  assert.equal(r.status, 409);
});

test("concurrent duplicate requests apply exactly once", async () => {
  const c = T.client(); await c.guest("Racer");
  const results = await Promise.all(Array.from({ length: 8 }, () => c.action("checkin", {}, "k-race-000001")));
  assert.ok(results.every((r) => r.status === 200), JSON.stringify(results.map((r) => r.body)));
  const n = await db.query(`SELECT count(*)::int AS n FROM resource_ledger WHERE user_id = $1 AND reason = 'checkin' AND resource = 'build_credits'`, [await uid("Racer")]);
  assert.equal(n.rows[0].n, 1);
  // different keys racing: still only one check-in per round
  const c2 = T.client(); await c2.guest("Racer2");
  const r2 = await Promise.all(Array.from({ length: 6 }, () => c2.action("checkin")));
  assert.equal(r2.filter((r) => r.status === 200).length, 1);
});

test("contributions are validated against server balances and per-round limits", async () => {
  const c = T.client(); await c.guest("Builder");
  assert.equal((await c.action("contribute", { districtId: 0, amount: 50 })).status, 400, "station is not a district");
  assert.equal((await c.action("contribute", { districtId: 1, amount: 13 })).status, 400, "steps of 5");
  const tooMuch = await c.action("contribute", { districtId: 1, amount: 200 });
  assert.equal(tooMuch.status, 409);
  assert.match(tooMuch.body.error.message, /Build Credits/);
  // race 6 contributions with different keys: at most 3 succeed, balance never negative
  const rs = await Promise.all(Array.from({ length: 6 }, () => c.action("contribute", { districtId: 2, amount: 30 })));
  const ok = rs.filter((r) => r.status === 200).length;
  assert.equal(ok, 3);
  const id = await uid("Builder");
  const { p, credits } = await ledgerConsistent(id);
  assert.equal(p.build_credits, credits, "balance equals start + ledger");
  assert.equal(p.build_credits, 10);
  const xp = (await db.query(`SELECT xp FROM districts WHERE id = 2`)).rows[0].xp;
  assert.ok(xp >= 90);
});

test("settlement levels up districts, credits contributors, and runs exactly once under concurrency", async () => {
  const builders = [];
  for (let i = 0; i < 4; i++) { const c = T.client(); await c.guest(`Crew${i}`); builders.push(c); }
  await db.query(`UPDATE player_resources SET build_credits = 1000, energy = 12`);
  for (const c of builders) for (let k = 0; k < 2; k++) assert.equal((await c.action("contribute", { districtId: 21, amount: 50 })).status, 200);
  const round = await engine.getOpenRound(db);
  const results = await Promise.all([1, 2, 3].map(() => engine.settleDue(new Date(), { force: true }).catch((e) => e)));
  const settled = await db.query(`SELECT count(*)::int AS n FROM game_rounds WHERE id = $1 AND status = 'settled'`, [round.id]);
  assert.equal(settled.rows[0].n, 1);
  const open = await db.query(`SELECT count(*)::int AS n FROM game_rounds WHERE status = 'open'`);
  assert.equal(open.rows[0].n, 1, "exactly one open round");
  assert.ok(results.some((r) => r && r.round === round.round_key));
  const d = (await db.query(`SELECT level FROM districts WHERE id = 21`)).rows[0];
  assert.ok(d.level >= 2, "400 XP reaches level 2+");
  const crew = await db.query(`SELECT count(*)::int AS n FROM user_badges WHERE cosmetic_id = 'crew-chief'`);
  assert.ok(crew.rows[0].n >= 4);
  const snap = await db.query(`SELECT count(*)::int AS n FROM leaderboard_snapshots WHERE round_id = $1`, [round.id]);
  assert.equal(snap.rows[0].n, 1);
  const audit = await db.query(`SELECT count(*)::int AS n FROM audit_logs WHERE action = 'round.settled' AND target = $1`, [round.round_key]);
  assert.equal(audit.rows[0].n, 1);
});

test("actions against a closed round are rejected", async () => {
  const c = T.client(); await c.guest("Late");
  const r = await engine.getOpenRound(db);
  const res = await engine.performAction(await uid("Late"), "checkin", {}, "k-late-000001", { now: new Date(new Date(r.ends_at).getTime() + 1000) }).catch((e) => e);
  assert.equal(res.code, "round_closed");
});

test("votes are tallied and the majority option is applied at settlement", async () => {
  // force a brief on the current round
  const r = await engine.getOpenRound(db);
  await db.query(`DELETE FROM city_events WHERE round_id = $1`, [r.id]);
  await db.query(`INSERT INTO city_events (round_id, kind, code, title, body, options) VALUES ($1,'brief','test','Test Brief','x',$2)`,
    [r.id, JSON.stringify([{ label: "A", effects: { vault: 40 } }, { label: "B", effects: { stability: -5 } }])]);
  const voters = [];
  for (let i = 0; i < 3; i++) { const c = T.client(); await c.guest(`Voter${i}`); voters.push(c); }
  assert.equal((await voters[0].action("vote", { option: 0 })).status, 200);
  assert.equal((await voters[1].action("vote", { option: 0 })).status, 200);
  assert.equal((await voters[2].action("vote", { option: 1 })).status, 200);
  assert.equal((await voters[2].action("vote", { option: 0 })).status, 409, "one vote per round");
  const s = await engine.settleDue(new Date(), { force: true });
  assert.equal(s.event.winner, 0);
  assert.deepEqual(s.event.tally, [2, 1]);
});

test("ledger and audit logs are append-only", async () => {
  await assert.rejects(() => db.query(`UPDATE resource_ledger SET delta = 999`), /append-only/);
  await assert.rejects(() => db.query(`DELETE FROM audit_logs`), /append-only/);
});

test("no stop ever takes resources from a player (beyond the move cost)", async () => {
  for (let i = 0; i < 6; i++) {
    const c = T.client(); await c.guest(`Rider${i}`);
    const m = await c.action("move");
    assert.equal(m.status, 200);
    assert.ok(m.body.gained.build_credits >= 0);
    assert.ok(m.body.gained.energy >= -2);
    assert.ok(m.body.gained.influence >= 0);
  }
});

test("admin requires allowlisted wallet + fresh re-auth; pause blocks actions; all logged", async () => {
  const guest = T.client(); await guest.guest("Rando");
  assert.equal((await guest.get("/api/admin/overview")).status, 401);
  const notAdmin = T.client(); await walletLogin(notAdmin, wallet());
  assert.equal((await notAdmin.get("/api/admin/overview")).status, 403);
  const a = T.client();
  assert.equal((await walletLogin(a, ADMIN)).status, 200);
  assert.equal((await a.get("/api/admin/overview")).status, 200);
  // stale re-auth
  await db.query(`UPDATE sessions SET reauth_at = now() - interval '11 minutes' WHERE wallet_address = $1`, [ADMIN.address]);
  const stale = await a.post("/api/admin/pause", { paused: true });
  assert.equal(stale.status, 401);
  assert.equal(stale.body.error.code, "reauth_required");
  const n = await a.post("/api/auth/nonce", { address: ADMIN.address, purpose: "reauth" });
  assert.equal((await a.post("/api/auth/verify", { address: ADMIN.address, nonce: n.body.nonce, signature: ADMIN.sign(n.body.message), purpose: "reauth" })).status, 200);
  assert.equal((await a.post("/api/admin/pause", { paused: true, reason: "test" })).status, 200);
  const blocked = await guest.action("checkin");
  assert.equal(blocked.status, 423);
  assert.equal((await a.post("/api/admin/pause", { paused: false })).status, 200);
  assert.equal((await a.post("/api/admin/flags", { key: "mainnet", enabled: true })).status, 403);
  const logs = await db.query(`SELECT action FROM audit_logs WHERE action LIKE 'admin.%'`);
  const acts = logs.rows.map((r) => r.action);
  assert.ok(acts.includes("admin.paused") && acts.includes("admin.resumed") && acts.includes("admin.denied"));
});

test("public state exposes no secrets and includes board, vault, leaderboard", async () => {
  const s = (await T.client().get("/api/state")).body;
  assert.equal(s.stops.length, 24);
  assert.equal(s.districts.length, 16);
  assert.ok(s.vault && s.leaderboard && s.round);
  const txt = JSON.stringify(s);
  assert.ok(!/csrf|id_hash|ip_hash|user_id/.test(txt));
});
