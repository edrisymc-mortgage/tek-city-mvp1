"use strict";
// Buy-with-SOL settlement: balance checks, review, idempotency, failed / expired transactions.
// The Solana RPC and Pump.fun builders are stubbed; signature checks run for real.
const { test, before, after, beforeEach } = require("node:test");
const assert = require("node:assert");
const { Keypair, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } = require("@solana/web3.js");
const { boot, wallet, walletLogin } = require("./helpers");
const sol = require("../server/chain/solana");
const pump = require("../server/chain/pump");
const db = require("../server/db/pool");

const MINT = Keypair.generate().publicKey.toBase58();
const BH = Keypair.generate().publicKey.toBase58(); // any 32-byte base58 works as a blockhash
let T, c, w, kp;
const orig = { ...sol }, origPump = { ...pump };
let chain; // stubbed chain behaviour per test

function buildTx(payer) {
  const msg = new TransactionMessage({ payerKey: new PublicKey(payer), recentBlockhash: BH,
    instructions: [SystemProgram.transfer({ fromPubkey: new PublicKey(payer), toPubkey: Keypair.generate().publicKey, lamports: 1000 })] }).compileToV0Message();
  return Buffer.from(new VersionedTransaction(msg).serialize()).toString("base64");
}
function signTx(b64) { const tx = VersionedTransaction.deserialize(Buffer.from(b64, "base64")); tx.sign([kp]); return Buffer.from(tx.serialize()).toString("base64"); }

before(async () => {
  T = await boot({ FEATURE_LAUNCHPAD: "true" });
  global.__TEKCITY_RATE_OVERRIDES = { ...global.__TEKCITY_RATE_OVERRIDES, purchase_init: { max: 1000 }, tx_submit: { max: 1000 } };
  w = wallet(); kp = Keypair.fromSecretKey(w.kp.secretKey);
  c = T.client(); await c.start(); await walletLogin(c, w);
  sol.solBalance = async () => chain.balance;
  sol.send = async () => { chain.sent += 1; if (chain.sendError) throw new Error(chain.sendError); return "x"; };
  sol.waitFor = async () => chain.wait;
  sol.sigStatus = async () => chain.status;
  sol.blockhashValid = async () => chain.blockhashValid;
  sol.getTx = async () => ({ transaction: { message: { accountKeys: [w.address, ...(chain.extraKeys || [])] } }, meta: { err: null, preBalances: [2e9], postBalances: [2e9 - 50_005_000], preTokenBalances: [], postTokenBalances: [{ mint: MINT, owner: w.address, uiTokenAmount: { uiAmount: 1000 } }] } });
  pump.buy = async ({ wallet: payer }) => ({ transaction: buildTx(payer) });
  const uid = (await db.query(`SELECT user_id FROM wallet_accounts WHERE address = $1`, [w.address])).rows[0].user_id;
  await db.query(`UPDATE player_resources SET position = 3 WHERE user_id = $1`, [uid]);
  await db.query(`INSERT INTO space_coins (stop_id, mint, name, symbol, launcher_wallet, launch_sig, split_done) VALUES (3,$1,'Test Coin','TEST',$2,'sig0',true)`, [MINT, w.address]);
});
after(async () => { Object.assign(sol, orig); Object.assign(pump, origPump); await T.close(); });
beforeEach(() => { chain = { balance: 2e9, sent: 0, wait: { state: "confirmed" }, status: { state: "confirmed" }, blockhashValid: true, sendError: null }; });

const purchases = async () => Number((await db.query(`SELECT COUNT(*) AS n FROM purchases`)).rows[0].n);
const grown = async () => Number((await db.query(`SELECT grown_lamports FROM space_coins WHERE stop_id = 3`)).rows[0].grown_lamports);

test("insufficient SOL is rejected before anything is built", async () => {
  chain.balance = 20_000_000;
  const r = await c.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  assert.equal(r.status, 402); assert.equal(r.body.error.code, "insufficient_sol");
  assert.match(r.body.error.message, /0\.055 SOL/);
});

test("buy returns a review, settles once, and duplicates are never credited", async () => {
  const before = await purchases(), g0 = await grown();
  const prep = await c.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  assert.equal(prep.status, 200);
  const rv = prep.body.review;
  assert.equal(rv.action, "buy"); assert.equal(rv.payer, w.address); assert.equal(rv.lamports, 50_000_000);
  assert.ok(rv.feeLamports >= 5000); assert.equal(rv.reserveLamports, 5_000_000);
  assert.ok(rv.programs.some((p) => p.label === "System program"));
  const signedTx = signTx(prep.body.transaction);
  const r1 = await c.post("/api/launchpad/submit", { intentId: prep.body.intentId, signedTx });
  assert.equal(r1.status, 200); assert.equal(r1.body.ok, true); assert.ok(!r1.body.already);
  const r2 = await c.post("/api/launchpad/submit", { intentId: prep.body.intentId, signedTx });
  assert.equal(r2.body.already, true);
  const r3 = await c.post("/api/launchpad/recheck", { signature: r1.body.signature });
  assert.equal(r3.body.already, true);
  assert.equal(await purchases(), before + 1);
  assert.equal(await grown(), g0 + 50_000_000);
  assert.equal(chain.sent, 1);
  const row = (await db.query(`SELECT * FROM purchases WHERE signature = $1`, [r1.body.signature])).rows[0];
  assert.equal(row.wallet, w.address); assert.equal(row.mint, MINT); assert.equal(Number(row.lamports), 50_000_000); assert.ok(row.processed_at);
});

test("a tampered transaction is refused and nothing is sent", async () => {
  const prep = await c.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  const other = signTx(buildTx(w.address)); // different instruction set
  const r = await c.post("/api/launchpad/submit", { intentId: prep.body.intentId, signedTx: other });
  assert.equal(r.status, 400); assert.equal(r.body.error.code, "tx_modified");
  assert.equal(chain.sent, 0);
});

test("signing rejected in the wallet: an unsubmitted request credits nothing", async () => {
  const before = await purchases();
  const prep = await c.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  assert.equal(prep.status, 200);
  assert.equal(await purchases(), before);
  const n = (await db.query(`SELECT COUNT(*) AS n FROM chain_tx_processing WHERE intent_id = $1`, [prep.body.intentId])).rows[0].n;
  assert.equal(Number(n), 0);
});

test("a transaction that fails on chain is recorded as failed and credits nothing", async () => {
  const before = await purchases(), g0 = await grown();
  chain.wait = { state: "failed", err: { InstructionError: [0, "Custom"] } }; chain.status = chain.wait;
  const prep = await c.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  const r = await c.post("/api/launchpad/submit", { intentId: prep.body.intentId, signedTx: signTx(prep.body.transaction) });
  assert.equal(r.body.ok, false); assert.equal(r.body.status, "failed");
  assert.equal(await purchases(), before); assert.equal(await grown(), g0);
  const st = (await db.query(`SELECT status FROM chain_tx_processing WHERE signature = $1`, [r.body.signature])).rows[0].status;
  assert.equal(st, "failed");
});

test("preflight rejection (e.g. not enough SOL at send time) is a clear error", async () => {
  chain.sendError = "Solana network error: Transaction simulation failed: insufficient lamports"; chain.status = { state: "unknown" };
  const prep = await c.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  const r = await c.post("/api/launchpad/submit", { intentId: prep.body.intentId, signedTx: signTx(prep.body.transaction) });
  assert.equal(r.status, 409); assert.equal(r.body.error.code, "tx_failed"); assert.match(r.body.error.message, /insufficient lamports/);
});

test("a dropped transaction times out, then expires without credit", async () => {
  const before = await purchases();
  chain.wait = { state: "timeout" };
  const prep = await c.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  const r = await c.post("/api/launchpad/submit", { intentId: prep.body.intentId, signedTx: signTx(prep.body.transaction) });
  assert.equal(r.status, 202); assert.equal(r.body.pending, true);
  chain.status = { state: "unknown" }; chain.blockhashValid = false;
  const r2 = await c.post("/api/launchpad/recheck", { signature: r.body.signature });
  assert.equal(r2.body.status, "expired");
  assert.equal(await purchases(), before);
});

test("a timed-out transaction that later confirms is credited exactly once", async () => {
  const before = await purchases();
  chain.wait = { state: "timeout" };
  const prep = await c.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  const r = await c.post("/api/launchpad/submit", { intentId: prep.body.intentId, signedTx: signTx(prep.body.transaction) });
  assert.equal(r.status, 202);
  chain.status = { state: "finalized" };
  const [a, b] = await Promise.all([c.post("/api/launchpad/recheck", { signature: r.body.signature }), c.post("/api/launchpad/recheck", { signature: r.body.signature })]);
  assert.ok(a.body.ok && b.body.ok);
  assert.equal(await purchases(), before + 1);
});

test("an expired request can't be submitted", async () => {
  const prep = await c.post("/api/launchpad/grow", { stopId: 3, lamports: 50_000_000 });
  await db.query(`UPDATE coin_intents SET expires_at = now() - interval '1 second' WHERE id = $1`, [prep.body.intentId]);
  const r = await c.post("/api/launchpad/submit", { intentId: prep.body.intentId, signedTx: signTx(prep.body.transaction) });
  assert.equal(r.status, 410); assert.equal(chain.sent, 0);
});

test("launch: wallet pays, review shown, launch persisted from prepared to placed", async () => {
  const MINT2 = Keypair.generate().publicKey.toBase58();
  pump.uploadMetadata = async () => ({ uri: "https://gateway.pinata.cloud/ipfs/meta", imageUri: "https://gateway.pinata.cloud/ipfs/img" });
  pump.createCoin = async ({ wallet: payer }) => ({ transaction: buildTx(payer), mintPublicKey: MINT2 });
  pump.sharingConfig = async ({ wallet: payer }) => ({ transaction: buildTx(payer) });
  const uid = (await db.query(`SELECT user_id FROM wallet_accounts WHERE address = $1`, [w.address])).rows[0].user_id;
  await db.query(`UPDATE player_resources SET position = 5 WHERE user_id = $1`, [uid]);
  const png = "data:image/png;base64," + Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(40).fill(0)]).toString("base64");
  chain.balance = 10_000_000;
  let r = await c.post("/api/launchpad/launch", { stopId: 5, name: "Tek Test", symbol: "TTT", image: png, lamports: 50_000_000 });
  assert.equal(r.status, 402); assert.equal(r.body.error.code, "insufficient_sol");
  chain.balance = 2e9;
  r = await c.post("/api/launchpad/launch", { stopId: 5, name: "Tek Test", symbol: "TTT", image: png, lamports: 50_000_000 });
  assert.equal(r.status, 200); assert.equal(r.body.review.action, "launch"); assert.equal(r.body.review.reserveLamports, 30_000_000);
  let row = (await db.query(`SELECT * FROM coin_launches WHERE intent_id = $1`, [r.body.intentId])).rows[0];
  assert.equal(row.status, "prepared"); assert.equal(row.creator_wallet, w.address); assert.equal(row.mint, MINT2);
  chain.extraKeys = [MINT2];
  const s1 = await c.post("/api/launchpad/submit", { intentId: r.body.intentId, signedTx: signTx(r.body.transaction) });
  assert.equal(s1.body.ok, true); assert.equal(s1.body.placed, true);
  row = (await db.query(`SELECT * FROM coin_launches WHERE intent_id = $1`, [r.body.intentId])).rows[0];
  assert.equal(row.status, "placed"); assert.equal(row.signature, s1.body.signature);
  const coin = (await db.query(`SELECT * FROM space_coins WHERE stop_id = 5`)).rows[0];
  assert.equal(coin.mint, MINT2); assert.equal(coin.launcher_wallet, w.address);
  const s2 = await c.post("/api/launchpad/submit", { intentId: r.body.intentId, signedTx: signTx(r.body.transaction) });
  assert.equal(s2.body.already, true);
});
