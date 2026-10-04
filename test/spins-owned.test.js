"use strict";
// Optional spin rules (SPIN_MODE=owned, optional): 1 free starter spin, then each round
// 1 spin per 500,000 TEK CITY owned (wallet + verified pump.fun profile). Vault jackpot once per 12 hours.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { boot, wallet, walletLogin } = require("./helpers");
const sol = require("../server/chain/solana");
const db = require("../server/db/pool");

const MINT = "So11111111111111111111111111111111111111112";
let T, bal = 0; const orig = { bal: sol.tokenBalance };
before(async () => { T = await boot({ FEATURE_LAUNCHPAD: "true", OFFICIAL_TOKEN_MINT: MINT, SPIN_MODE: "owned" }); sol.tokenBalance = async () => bal; });
after(async () => { sol.tokenBalance = orig.bal; await T.close(); });

async function player() { const c = T.client(); await c.start(); const w = wallet(); await walletLogin(c, w); const uid = (await db.query(`SELECT user_id FROM wallet_accounts WHERE address = $1`, [w.address])).rows[0].user_id; return { c, uid }; }

test("starter spin, then 1 per 500K owned per round", async () => {
  assert.equal(T.config.spins.mode, "owned");
  bal = 0;
  const { c, uid } = await player();
  let me = (await c.get("/api/me")).body;
  assert.equal(me.spins.left, 1); assert.equal(me.spins.starterLeft, 1); assert.equal(me.spins.allowance, 0);
  assert.equal((await c.action("move")).status, 200);
  await db.query(`UPDATE player_resources SET bonus_left = 0 WHERE user_id = $1`, [uid]);
  let r = await c.action("move");
  assert.equal(r.status, 409); assert.equal(r.body.error.code, "no_spins");
  bal = 1_200_000; // owns 1.2M -> 2 spins this round
  me = (await c.get("/api/me")).body;
  assert.equal(me.spins.allowance, 2); assert.equal(me.spins.left, 2);
  assert.equal((await c.action("move")).status, 200);
  await db.query(`UPDATE player_resources SET bonus_left = 0 WHERE user_id = $1`, [uid]);
  assert.equal((await c.action("move")).status, 200);
  await db.query(`UPDATE player_resources SET bonus_left = 0 WHERE user_id = $1`, [uid]);
  r = await c.action("move");
  assert.equal(r.status, 409, "round allowance used up");
  // next round: allowance refills
  await db.query(`UPDATE player_resources SET round_spins_round = round_spins_round - 1 WHERE user_id = $1`, [uid]);
  me = (await c.get("/api/me")).body;
  assert.equal(me.spins.roundLeft, 2);
});

test("Vault jackpot pays once per 12 hours across the board", async () => {
  bal = 5_000_000;
  const vaultId = require("../server/game/board").STOPS.findIndex((s) => s.type === "vault");
  assert.ok(vaultId > 0);
  const hit = async () => {
    const { c, uid } = await player();
    // stand 1 space before the Vault and force a roll of 1 by retrying until we land there
    for (let i = 0; i < 40; i++) {
      await db.query(`UPDATE player_resources SET position = $2, round_spins_used = 0 WHERE user_id = $1`, [uid, (vaultId - 1 + 24) % 24]);
      const r = await c.action("move");
      if (r.status === 200 && r.body.to === vaultId) return r.body;
    }
    throw new Error("never landed");
  };
  await db.query(`TRUNCATE vault_hits`);
  const a = await hit();
  assert.match(a.message, /Vault jackpot: \+1/);
  const b = await hit();
  assert.match(b.message, /already hit/);
  assert.equal(Number((await db.query(`SELECT COUNT(*) AS n FROM vault_hits`)).rows[0].n), 1);
  const info = (await T.client().get("/api/launchpad/info")).body;
  assert.equal(info.vault.ready, false); assert.ok(info.vault.nextAt);
  await db.query(`UPDATE vault_hits SET hit_at = now() - interval '13 hours'`);
  const c3 = await hit();
  assert.match(c3.message, /Vault jackpot: \+1/);
});
