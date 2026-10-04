"use strict";
// SPIN_MODE=bought: first spin free, then 1 per 500,000 bought.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { boot, wallet, walletLogin } = require("./helpers");
const sol = require("../server/chain/solana");
const db = require("../server/db/pool");

const MINT = "So11111111111111111111111111111111111111112";
let T; const orig = { rpc: sol.rpc, bal: sol.tokenBalance };
before(async () => {
  T = await boot({ FEATURE_LAUNCHPAD: "true", OFFICIAL_TOKEN_MINT: MINT, SPIN_MODE: "bought" });
  sol.tokenBalance = async () => 0;
  sol.rpc = async (m) => { if (m === "getTokenAccountsByOwner") return { value: [] }; throw new Error(`unexpected rpc ${m}`); };
});
after(async () => { sol.rpc = orig.rpc; sol.tokenBalance = orig.bal; await T.close(); });

test("first spin is free, then 1 spin per 500,000 TEK CITY bought", async () => {
  assert.equal(T.config.spins.mode, "bought");
  const c = T.client(); await c.start(); const w = wallet(); await walletLogin(c, w);
  let me = (await c.get("/api/me")).body;
  assert.equal(me.spins.left, 1); assert.equal(me.spins.starter, 1);
  let r = await c.action("move");
  assert.equal(r.status, 200, JSON.stringify(r.body));
  r = await c.action("move");
  assert.equal(r.status, 409); assert.equal(r.body.error.code, "no_spins");
  // two verified buys: 400k + 700k = 1.1M -> 2 more spins
  const uid = (await db.query(`SELECT user_id FROM wallet_accounts WHERE address = $1`, [w.address])).rows[0].user_id;
  await db.query(`INSERT INTO tek_buys (signature, user_id, wallet, tokens, spent_lamports, block_time) VALUES ($1,$2,$3,400000,1e8,now()), ($4,$2,$3,700000,2e8,now())`, ["s".repeat(70) + "1", uid, w.address, "s".repeat(70) + "2"]);
  me = (await c.get("/api/me")).body;
  const used = me.spins.used;
  assert.equal(me.spins.earned - (me.spins.bonus || 0), 1 + 2);
  assert.equal(me.spins.left, me.spins.earned - used);
  assert.ok(me.spins.next > 0 && me.spins.next <= 500000);
});
