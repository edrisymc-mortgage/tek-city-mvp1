"use strict";
// pump.fun profile linking (FEATURE_PUMP_BIO_LINK): an email/X pump.fun user proves the profile is theirs with a bio
// code. That address is then read (never signed for) so the TEK CITY it owns counts toward spins.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { Keypair } = require("@solana/web3.js");
const { boot, wallet, walletLogin } = require("./helpers");
const sol = require("../server/chain/solana");

const MINT = "So11111111111111111111111111111111111111112";
const PUMP_ADDR = Keypair.generate().publicKey.toBase58();
let T, bio = ""; const scanned = new Set();
const orig = { fetch: global.fetch, rpc: sol.rpc, bal: sol.tokenBalance };
before(async () => {
  T = await boot({ FEATURE_LAUNCHPAD: "true", OFFICIAL_TOKEN_MINT: MINT, FEATURE_PUMP_BIO_LINK: "true" });
  global.fetch = async (url, o) => {
    const u = String(url);
    if (u.startsWith("https://frontend-api-v3.pump.fun/users/")) {
      const addr = u.split("/users/")[1].split("?")[0];
      if (addr !== PUMP_ADDR) return new Response(JSON.stringify({ statusCode: 404 }), { status: 404 });
      return new Response(JSON.stringify({ address: PUMP_ADDR, username: "emailguy", bio, profile_image: null, followers: 1 }), { status: 200 });
    }
    if (u.startsWith("https://frontend-api-v3.pump.fun/")) return new Response("[]", { status: 200 });
    return orig.fetch(url, o);
  };
  sol.tokenBalance = async (w) => { scanned.add(w); return w === PUMP_ADDR ? 1_000_000 : 0; };
  sol.rpc = async (m, p) => { if (m === "getTokenAccountsByOwner") { scanned.add(p[0]); return { value: [] }; } throw new Error(`unexpected rpc ${m}`); };
});
after(async () => { global.fetch = orig.fetch; sol.rpc = orig.rpc; sol.tokenBalance = orig.bal; await T.close(); });

test("link a pump.fun profile by bio code; its TEK CITY balance counts for spins", async () => {
  const c = T.client(); await c.start(); await walletLogin(c, wallet());
  let r = await c.post("/api/pump/link/start", { address: `https://pump.fun/profile/${PUMP_ADDR}` });
  assert.equal(r.status, 200, JSON.stringify(r.body)); const code = r.body.code;
  r = await c.post("/api/pump/link/verify", {});
  assert.equal(r.status, 409, "code not in bio yet");
  bio = `gm ${code}`;
  r = await c.post("/api/pump/link/verify", {});
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const me = await c.get("/api/pump/me");
  assert.equal(me.body.linked, true); assert.equal(me.body.profile.via, "bio");
  const meState = (await c.get("/api/me")).body;
  assert.ok(scanned.has(PUMP_ADDR), "linked pump.fun wallet's TEK CITY balance is read");
  assert.equal(meState.spins.balance, 1_000_000); assert.equal(meState.spins.allowance, 2, "1M owned on pump.fun = 2 spins per round");
  // another player can't claim the same profile
  const d = T.client(); await d.start(); await walletLogin(d, wallet());
  r = await d.post("/api/pump/link/start", { address: PUMP_ADDR });
  assert.equal(r.status, 409);
});
