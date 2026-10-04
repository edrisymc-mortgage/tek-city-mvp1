"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { boot, wallet, walletLogin } = require("./helpers");
const { normalizeAddress, b58encode } = require("../server/auth/address");
const { load } = require("../server/config");
const db = require("../server/db/pool");
const { limiter } = require("../server/security/rateLimit");

let T;
test.before(async () => { T = await boot({ ADMIN_WALLET_ALLOWLIST: "" }); });
test.after(async () => { await T.close(); });
test.beforeEach(() => limiter.reset());

test("address normalization accepts only canonical 32-byte base58 keys", () => {
  const a = b58encode(new Uint8Array(32).fill(7));
  assert.equal(normalizeAddress(a), a);
  assert.equal(normalizeAddress(`  ${a}\n`), a);
  assert.equal(normalizeAddress(a.replace(/./, "0")), null, "0 is not base58");
  assert.equal(normalizeAddress(a.slice(0, 20)), null, "too short");
  assert.equal(normalizeAddress(b58encode(new Uint8Array(33).fill(9))), null, "33 bytes rejected");
  assert.equal(normalizeAddress("11111111111111111111111111111111"), "11111111111111111111111111111111");
  assert.equal(normalizeAddress(null), null);
  assert.equal(normalizeAddress({}), null);
});

test("nonce message contains the required sign-in statement fields", async () => {
  const c = T.client(); await c.start();
  const w = wallet();
  const r = await c.post("/api/auth/nonce", { address: w.address });
  assert.equal(r.status, 200);
  const m = r.body.message;
  assert.match(m, /Sign in to TEK CITY/);
  assert.ok(m.includes(new URL(T.base).host), "domain");
  assert.ok(m.includes(w.address), "address");
  assert.ok(m.includes(`Nonce: ${r.body.nonce}`), "nonce");
  assert.match(m, /Issued At: \d{4}-/);
  assert.match(m, /Expiration Time: \d{4}-/);
  assert.match(m, /does not authorize any transaction, transfer/);
  assert.match(m, /Chain ID: solana:devnet/);
  assert.match(r.body.nonce, /^[a-f0-9]{32}$/);
  const r2 = await c.post("/api/auth/nonce", { address: w.address });
  assert.notEqual(r2.body.nonce, r.body.nonce, "nonces are random");
});

test("valid signature signs in, sets a secure HttpOnly session, and rotates the session", async () => {
  const c = T.client(); await c.start();
  const before = { ...c.cookies };
  const w = wallet();
  const r = await walletLogin(c, w);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.me.signedIn, true);
  assert.equal(r.body.me.user.wallet.address, w.address);
  const setCookie = r.headers.getSetCookie().join("\n");
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Lax/i);
  assert.notDeepEqual(c.cookies, before, "session token rotated on login");
  const stored = await db.query(`SELECT count(*)::int AS n FROM sessions WHERE id_hash = $1`, [Object.values(c.cookies)[0]]);
  assert.equal(stored.rows[0].n, 0, "raw token is never stored");
  const me = await c.get("/api/me");
  assert.equal(me.body.user.authMethod, "wallet");
});

test("nonce reuse, expiry, bad signature, and address mismatch are rejected", async () => {
  const c = T.client(); await c.start();
  const w = wallet(); const other = wallet();
  // reuse
  const n = await c.post("/api/auth/nonce", { address: w.address });
  const sig = w.sign(n.body.message);
  assert.equal((await c.post("/api/auth/verify", { address: w.address, nonce: n.body.nonce, signature: sig })).status, 200);
  const again = await c.post("/api/auth/verify", { address: w.address, nonce: n.body.nonce, signature: sig });
  assert.equal(again.status, 401);
  limiter.reset();
  // bad signature (signed by another key) burns the nonce
  const c2 = T.client(); await c2.start();
  const n2 = await c2.post("/api/auth/nonce", { address: w.address });
  const bad = await c2.post("/api/auth/verify", { address: w.address, nonce: n2.body.nonce, signature: other.sign(n2.body.message) });
  assert.equal(bad.status, 401);
  const retry = await c2.post("/api/auth/verify", { address: w.address, nonce: n2.body.nonce, signature: w.sign(n2.body.message) });
  assert.equal(retry.status, 401, "nonce burned after a failed attempt");
  // tampered message
  const n3 = await c2.post("/api/auth/nonce", { address: w.address });
  const t = await c2.post("/api/auth/verify", { address: w.address, nonce: n3.body.nonce, signature: w.sign(n3.body.message + " ") });
  assert.equal(t.status, 401);
  limiter.reset();
  // address mismatch
  const n4 = await c2.post("/api/auth/nonce", { address: w.address });
  const mm = await c2.post("/api/auth/verify", { address: other.address, nonce: n4.body.nonce, signature: other.sign(n4.body.message) });
  assert.equal(mm.status, 401);
  limiter.reset();
  // expired
  const n5 = await c2.post("/api/auth/nonce", { address: w.address });
  await db.query(`UPDATE wallet_login_nonces SET expires_at = now() - interval '1 second' WHERE nonce = $1`, [n5.body.nonce]);
  const ex = await c2.post("/api/auth/verify", { address: w.address, nonce: n5.body.nonce, signature: w.sign(n5.body.message) });
  assert.equal(ex.status, 401);
  assert.match(ex.body.error.message, /expired/);
  // nonce from another session cannot be used
  const c3 = T.client(); await c3.start();
  const n6 = await c2.post("/api/auth/nonce", { address: w.address });
  const cross = await c3.post("/api/auth/verify", { address: w.address, nonce: n6.body.nonce, signature: w.sign(n6.body.message) });
  assert.equal(cross.status, 401);
  const logs = await db.query(`SELECT details FROM audit_logs WHERE action = 'auth.login_failed'`);
  assert.ok(logs.rowCount >= 5);
  assert.ok(!JSON.stringify(logs.rows).includes(sig), "signatures are never logged");
});

test("a browser-provided address alone is never treated as authenticated", async () => {
  const c = T.client(); await c.start();
  const w = wallet();
  await c.post("/api/auth/nonce", { address: w.address });
  const me = await c.get("/api/me");
  assert.equal(me.body.signedIn, false);
  const act = await c.action("checkin");
  assert.equal(act.status, 401);
});

test("guest mode works and a guest can link a wallet once", async () => {
  const c = T.client();
  const g = await c.guest("Guesty");
  assert.equal(g.status, 200);
  assert.equal(g.body.me.user.kind, "guest");
  const w = wallet();
  const r = await walletLogin(c, w);
  assert.equal(r.status, 200);
  assert.equal(r.body.me.user.name, "Guesty", "guest progress kept after linking");
  const u = await db.query(`SELECT count(*)::int AS n FROM wallet_accounts WHERE address = $1`, [w.address]);
  assert.equal(u.rows[0].n, 1);
});

test("sessions expire and logout revokes", async () => {
  const c = T.client(); await c.guest("Expiry");
  assert.equal((await c.get("/api/me")).body.signedIn, true);
  await db.query(`UPDATE sessions SET expires_at = now() - interval '1 second' WHERE user_id IS NOT NULL AND revoked_at IS NULL AND auth_method = 'guest'`);
  assert.equal((await c.get("/api/me")).body.signedIn, false);
  const c2 = T.client(); await c2.guest("Logout");
  await c2.post("/api/auth/logout", {});
  assert.equal((await c2.get("/api/me")).body.signedIn, false);
});

test("CSRF and Origin checks reject unauthorized state changes", async () => {
  const c = T.client(); await c.guest("Csrf");
  const good = c.csrf;
  c.csrf = "nope";
  assert.equal((await c.action("checkin")).status, 403);
  c.csrf = good;
  const evil = await c.post("/api/action/checkin", {}, { origin: "https://evil.example", "idempotency-key": "k-evil-000001" });
  assert.equal(evil.status, 403);
  const noKey = await c.post("/api/action/checkin", {});
  assert.equal(noKey.status, 400);
  assert.equal(noKey.body.error.code, "idempotency_required");
});

test("rate limits block nonce floods and record events", async () => {
  const c = T.client(); await c.start();
  const w = wallet();
  let last;
  for (let i = 0; i < 11; i++) last = await c.post("/api/auth/nonce", { address: w.address });
  assert.equal(last.status, 429);
  assert.ok(last.headers.get("retry-after"));
  await new Promise((r) => setTimeout(r, 50));
  const ev = await db.query(`SELECT count(*)::int AS n FROM rate_limit_events WHERE bucket = 'auth_nonce'`);
  assert.ok(ev.rows[0].n >= 1);
});

test("malformed input is rejected safely", async () => {
  const c = T.client(); await c.guest("Malform");
  const badJson = await c.post("/api/action/checkin", "{not json", { "idempotency-key": "k-badjson-001" });
  assert.equal(badJson.status, 400);
  assert.equal((await c.action("checkin", { roll: 6 })).status, 400, "unknown fields rejected");
  assert.equal((await c.action("contribute", { districtId: 1, amount: "50" })).status, 400);
  assert.equal((await c.action("contribute", { districtId: 99, amount: 50 })).status, 400);
  assert.equal((await c.action("contribute", { districtId: 1, amount: 12.5 })).status, 400);
  assert.equal((await c.action("nonsense")).status, 404);
  const big = await c.post("/api/support", { kind: "contact", subject: "x".repeat(50), body: "y".repeat(20000) });
  assert.ok([400, 413].includes(big.status));
  assert.equal((await c.post("/api/guest", { name: "<script>" })).status, 400);
  const err = await c.post("/api/auth/nonce", { address: "not-an-address-at-all-0000000000000" });
  assert.equal(err.status, 400);
  assert.ok(!/\n\s+at |\/home\//.test(JSON.stringify(err.body)), "no stack traces leak");
});

test("feature flags: mainnet and on-chain actions are locked off", async () => {
  const flags = require("../server/flags");
  await assert.rejects(() => flags.assertOnchainAllowed(), /disabled/);
  await assert.rejects(() => db.tx((c) => flags.set(c, "mainnet", true, "test")), /locked/);
  await assert.rejects(() => db.tx((c) => flags.set(c, "onchain_actions", true, "test")), /locked/);
  const cfg = load({ NODE_ENV: "production", SOLANA_NETWORK: "mainnet-beta", FEATURE_MAINNET: "true" });
  assert.equal(cfg.solana.network, "devnet", "mainnet needs both flags");
  const cfgPub = await T.client().get("/api/config");
  assert.equal(cfgPub.body.features.onchainActions, false);
  assert.equal(cfgPub.body.official.tokenMint, null, "no token address unless configured");
  assert.ok(!JSON.stringify(cfgPub.body).match(/SESSION_SECRET|DATABASE_URL|rpc/i), "no secrets in public config");
});

test("admin API is disabled when no allowlist is configured", async () => {
  const c = T.client(); await c.guest("NotAdmin");
  assert.equal((await c.get("/api/admin/overview")).status, 404);
});

test("security headers: CSP, frame denial, no x-powered-by", async () => {
  const r = await fetch(T.base + "/health");
  assert.match(r.headers.get("content-security-policy"), /default-src 'self'/);
  assert.match(r.headers.get("content-security-policy"), /frame-ancestors 'none'/);
  assert.equal(r.headers.get("x-powered-by"), null);
  const h = await r.json();
  assert.equal(h.status, "ok");
});

test("mainnet sign-in message uses a SIWS chain id wallets accept", () => {
  const { buildMessage } = require("../server/auth/siws");
  const m = buildMessage({ domain: "x.example", uri: "https://x.example", address: "A", nonce: "n", issuedAt: "t", expiresAt: "e", network: "mainnet-beta", purpose: "login" });
  assert.match(m, /\nChain ID: solana:mainnet\n/);
});
