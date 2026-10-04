"use strict";
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { boot, wallet, walletLogin } = require("./helpers");

let T;
before(async () => { T = await boot({ FEATURE_LAUNCHPAD: "true" }); });
after(async () => { await T.close(); });

test("launchpad info and state expose coins without secrets", async () => {
  const c = T.client(); await c.start();
  const info = await c.get("/api/launchpad/info");
  assert.equal(info.status, 200);
  assert.equal(info.body.enabled, true);
  assert.ok(!JSON.stringify(info.body).match(/jwt|secret|rpc/i));
  const st = await c.get("/api/state");
  assert.ok(Array.isArray(st.body.coins));
  assert.equal(st.body.launchpad.enabled, true);
});

test("launch requires a linked wallet and being on the space", async () => {
  const g = T.client(); await g.start();
  let r = await g.post("/api/guest", { name: "NoWallet" });
  assert.equal(r.status, 403); assert.equal(r.body.error.code, "wallet_required");
  r = await g.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  assert.ok([401, 403].includes(r.status));
  r = await g.action("move");
  assert.ok([401, 403].includes(r.status));
  assert.equal((await g.get("/api/me")).body.signedIn, false);
  const c = T.client(); await c.start(); await walletLogin(c, wallet());
  r = await c.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  assert.equal(r.status, 409); assert.equal(r.body.error.code, "not_on_space");
  r = await c.post("/api/launchpad/grow", { stopId: 0, lamports: 50_000_000 });
  assert.equal(r.status, 400); assert.equal(r.body.error.code, "bad_space");
});

test("submit rejects unknown or foreign intents", async () => {
  const c = T.client(); await c.start(); await walletLogin(c, wallet());
  const r = await c.post("/api/launchpad/submit", { intentId: "a".repeat(32), signedTx: "A".repeat(200) });
  assert.equal(r.status, 404);
});

test("before OFFICIAL_TOKEN_MINT is set, every player gets 1 free spin per round", async () => {
  const c = T.client(); await c.start(); await walletLogin(c, wallet());
  const r = await c.action("move");
  assert.equal(r.status, 200);
  const me = await c.get("/api/me");
  assert.ok(!me.body.spins.holder);
});
