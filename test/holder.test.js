"use strict";
// Holder gating with OFFICIAL_TOKEN_MINT set (SPIN_MODE=holder, the default).
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { boot, wallet, walletLogin } = require("./helpers");
const sol = require("../server/chain/solana");

const MINT = "So11111111111111111111111111111111111111112";
let T; const orig = sol.tokenBalance; let bal = 0, calls = 0;
before(async () => { T = await boot({ FEATURE_LAUNCHPAD: "true", OFFICIAL_TOKEN_MINT: MINT }); sol.tokenBalance = async () => { calls += 1; return bal; }; });
after(async () => { sol.tokenBalance = orig; await T.close(); });

test("guests can't spin once the token is live", async () => {
  const g = T.client(); await g.start();
  assert.equal((await g.post("/api/guest", { name: "Guesty" })).status, 403);
  const r = await g.action("move");
  assert.ok([401, 403].includes(r.status));
});

test("wallets under 500,000 TEK CITY get no free spin", async () => {
  const c = T.client(); await c.start(); await walletLogin(c, wallet());
  bal = 499_999;
  const r = await c.action("move");
  assert.equal(r.status, 403); assert.equal(r.body.error.code, "holder_required");
  const me = await c.get("/api/me");
  assert.ok(me.body.can.move); assert.equal(me.body.spins.holder.eligible, false);
});

test("holders get exactly one free spin per round, balance re-read server-side", async () => {
  const c = T.client(); await c.start(); await walletLogin(c, wallet());
  bal = 500_000; const n0 = calls;
  const r = await c.action("move");
  assert.equal(r.status, 200);
  assert.ok(calls > n0, "balance was checked on the server for the spin");
  const again = await c.action("move");
  assert.ok([409, 403].includes(again.status));
});
