"use strict";
// Creator-reward Community Fund: detection, 20/80 integer allocation, idempotency, rejection/reversal,
// transfer verification, and the "no funds move from this server" guarantees. Solana RPC is stubbed.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const { Keypair } = require("@solana/web3.js");
const { boot, wallet, walletLogin } = require("./helpers");
const { load } = require("../server/config");
const sol = require("../server/chain/solana");
const cr = require("../server/chain/creatorRewards");
const db = require("../server/db/pool");

const OP = Keypair.generate().publicKey.toBase58();
const TREASURY = Keypair.generate().publicKey.toBase58();
const OTHER = Keypair.generate().publicKey.toBase58();
const PUMP = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
const SYSTEM = "11111111111111111111111111111111";
const ADMIN = wallet();
let T; const origRpc = sol.rpc;
const chain = { finalized: new Map(), confirmed: new Map() };
const sig = () => Buffer.from(Keypair.generate().secretKey).toString("hex").slice(0, 88).replace(/[0OIl]/g, "A").replace(/[^1-9A-HJ-NP-Za-km-z]/g, "B");

// A parsed transaction where `keys[i]` changes by `deltas[i]` lamports.
function ptx({ keys, deltas, program = PUMP, err = null, fee = 5000, slot = 1000 }) {
  const pre = keys.map(() => 10_000_000_000), post = pre.map((p, i) => p + (deltas[i] || 0) - (i === 0 ? fee : 0));
  return { slot, blockTime: 1_760_000_000, transaction: { message: { accountKeys: keys.map((k) => ({ pubkey: k })), instructions: [{ programId: program }] } },
    meta: { err, fee, preBalances: pre, postBalances: post, preTokenBalances: [], postTokenBalances: [], innerInstructions: [] } };
}

before(async () => {
  T = await boot({ FEATURE_LAUNCHPAD: "true", ADMIN_WALLET_ALLOWLIST: ADMIN.address, OPERATOR_CREATOR_REWARD_WALLET: OP, COMMUNITY_TREASURY_WALLET: TREASURY });
  sol.rpc = async (method, params) => {
    if (method === "getTransaction") return (params[1].commitment === "finalized" ? chain.finalized : chain.confirmed).get(params[0]) || chain.finalized.get(params[0]) && params[1].commitment !== "finalized" && chain.finalized.get(params[0]) || null;
    if (method === "getSignaturesForAddress") return [...new Set([...chain.confirmed.keys(), ...chain.finalized.keys()])].map((signature) => ({ signature }));
    throw new Error(`unexpected rpc ${method}`);
  };
});
after(async () => { sol.rpc = origRpc; await T.close(); });

const count = async (t) => Number((await db.query(`SELECT COUNT(*) AS n FROM ${t}`)).rows[0].n);

test("integer split: 20% community, 80% operator, remainder stays with operator", () => {
  assert.deepEqual(cr.split(1_000_000_000n, 2000), { community: 200_000_000n, operator: 800_000_000n });
  assert.deepEqual(cr.split(7n, 2000), { community: 1n, operator: 6n });
  assert.deepEqual(cr.split(4n, 2000), { community: 0n, operator: 4n });
  const big = 123_456_789_123_456_789n; const s = cr.split(big, 2000);
  assert.equal(s.community + s.operator, big);
  assert.throws(() => cr.split(0n, 2000));
});

test("config validation keeps the three addresses separate and rejects server-held signers", () => {
  const base = { NODE_ENV: "test", SESSION_SECRET: "t".repeat(48) };
  assert.ok(load({ ...base, OPERATOR_CREATOR_REWARD_WALLET: OP, COMMUNITY_TREASURY_WALLET: OP }).communityFund.errors.some((e) => /different/.test(e)));
  assert.ok(load({ ...base, OPERATOR_CREATOR_REWARD_WALLET: OP, OFFICIAL_TOKEN_MINT: OP }).communityFund.errors.some((e) => /OFFICIAL_TOKEN_MINT/.test(e)));
  assert.ok(load({ ...base, COMMUNITY_FUND_ALLOCATION_BPS: "2500" }).communityFund.errors.some((e) => /10000/.test(e)));
  assert.ok(load({ ...base, REWARDS_WALLET_SECRET: "x" }).communityFund.errors.some((e) => /REWARDS_WALLET_SECRET/.test(e)));
  const ok = load({ ...base, OPERATOR_CREATOR_REWARD_WALLET: OP, COMMUNITY_TREASURY_WALLET: TREASURY }).communityFund;
  assert.equal(ok.enabled, false); assert.equal(ok.accounting, true); assert.equal(ok.communityBps, 2000); assert.equal(ok.operatorBps, 8000);
});

test("a finalized 1.00 SOL creator reward allocates 0.20 SOL community / 0.80 SOL operator", async () => {
  const s = sig();
  chain.finalized.set(s, ptx({ keys: [OTHER, OP], deltas: [-1_000_000_000, 1_000_000_000] }));
  const out = await cr.processSignature(s);
  assert.equal(out.results[0].status, "confirmed");
  const ev = (await db.query(`SELECT * FROM creator_reward_events WHERE source_transaction_signature = $1`, [s])).rows[0];
  assert.equal(ev.asset_mint, "SOL"); assert.equal(ev.reward_amount_base_units, "1000000000"); assert.equal(ev.reward_recipient_wallet, OP);
  const al = (await db.query(`SELECT * FROM creator_reward_allocations WHERE creator_reward_event_id = $1`, [ev.id])).rows[0];
  assert.equal(al.community_fund_amount_base_units, "200000000"); assert.equal(al.operator_retained_amount_base_units, "800000000");
  assert.equal(al.status, "calculated"); assert.equal(al.community_treasury_wallet, TREASURY);
  const led = (await db.query(`SELECT * FROM community_fund_ledger WHERE source_allocation_id = $1`, [al.id])).rows[0];
  assert.equal(led.status, "pending"); assert.equal(led.transfer_verified, false); assert.equal(led.transaction_signature, null);
});

test("operator claiming its own reward counts the fee it paid back in", async () => {
  const s = sig();
  chain.finalized.set(s, ptx({ keys: [OP], deltas: [500_000_000], fee: 5000 }));
  await cr.processSignature(s);
  const ev = (await db.query(`SELECT reward_amount_base_units FROM creator_reward_events WHERE source_transaction_signature = $1`, [s])).rows[0];
  assert.equal(ev.reward_amount_base_units, "500000000");
});

test("no allocation until the receipt is finalized", async () => {
  const s = sig(); const t = ptx({ keys: [OTHER, OP], deltas: [-300_000_000, 300_000_000] });
  chain.confirmed.set(s, t);
  const a0 = await count("creator_reward_allocations");
  const r1 = await cr.processSignature(s);
  assert.equal(r1.results[0].status, "detected");
  assert.equal(await count("creator_reward_allocations"), a0);
  chain.finalized.set(s, t);
  const r2 = await cr.processSignature(s);
  assert.equal(r2.results[0].status, "confirmed");
  assert.equal(await count("creator_reward_allocations"), a0 + 1);
});

test("duplicate processing never duplicates events or allocations", async () => {
  const s = sig();
  chain.finalized.set(s, ptx({ keys: [OTHER, OP], deltas: [-100_000_000, 100_000_000] }));
  const e0 = await count("creator_reward_events"), a0 = await count("creator_reward_allocations"), l0 = await count("community_fund_ledger");
  await Promise.all([cr.processSignature(s), cr.processSignature(s), cr.processSignature(s)]);
  await cr.processSignature(s); await cr.tick();
  assert.equal(await count("creator_reward_events"), e0 + 1);
  assert.equal(await count("creator_reward_allocations"), a0 + 1);
  assert.equal(await count("community_fund_ledger"), l0 + 1);
});

test("failed transactions and non-Pump receipts never fund the Community Fund", async () => {
  const a0 = await count("creator_reward_allocations");
  const f = sig(); chain.finalized.set(f, ptx({ keys: [OTHER, OP], deltas: [0, 0], err: { InstructionError: [0, "Custom"] } }));
  const r = await cr.processSignature(f);
  assert.equal(r.results[0].status, "rejected");
  const n = sig(); chain.finalized.set(n, ptx({ keys: [OTHER, OP], deltas: [-2_000_000_000, 2_000_000_000], program: SYSTEM }));
  assert.equal((await cr.processSignature(n)).skipped, "not_a_creator_reward");
  assert.equal(await count("creator_reward_allocations"), a0);
});

test("reversed rewards reverse their allocation and ledger row", async () => {
  const s = sig(); chain.finalized.set(s, ptx({ keys: [OTHER, OP], deltas: [-50_000_000, 50_000_000] }));
  await cr.processSignature(s);
  const ev = (await db.query(`SELECT id FROM creator_reward_events WHERE source_transaction_signature = $1`, [s])).rows[0];
  assert.equal((await cr.reverseEvent(ev.id, "ineligible source")).ok, true);
  const al = (await db.query(`SELECT a.status, l.status AS ls FROM creator_reward_allocations a JOIN community_fund_ledger l ON l.source_allocation_id = a.id WHERE a.creator_reward_event_id = $1`, [ev.id])).rows[0];
  assert.equal(al.status, "reversed"); assert.equal(al.ls, "reversed");
  await assert.rejects(db.query(`UPDATE creator_reward_allocations SET community_fund_amount_base_units = 1 WHERE creator_reward_event_id = $1`, [ev.id]), /immutable/);
  await assert.rejects(db.query(`DELETE FROM community_fund_ledger`), /append-only/);
});

test("ledger is confirmed only after a finalized multisig transfer to the treasury is verified", async () => {
  const s = sig(); chain.finalized.set(s, ptx({ keys: [OTHER, OP], deltas: [-1_000_000_000, 1_000_000_000] }));
  const out = await cr.processSignature(s); const id = out.results[0].allocation.id;
  const short = sig(); chain.finalized.set(short, ptx({ keys: [OP, TREASURY], deltas: [-100_000_000, 100_000_000], program: SYSTEM }));
  assert.equal((await cr.verifyTransfer(id, short)).code, "amount_short");
  const wrongTo = sig(); chain.finalized.set(wrongTo, ptx({ keys: [OP, OTHER], deltas: [-200_000_000, 200_000_000], program: SYSTEM }));
  assert.equal((await cr.verifyTransfer(id, wrongTo)).ok, false);
  const pending = sig(); chain.confirmed.set(pending, ptx({ keys: [OP, TREASURY], deltas: [-200_000_000, 200_000_000], program: SYSTEM }));
  assert.equal((await cr.verifyTransfer(id, pending)).code, "not_finalized");
  const good = sig(); chain.finalized.set(good, ptx({ keys: [OP, TREASURY], deltas: [-200_000_000, 200_000_000], program: SYSTEM }));
  assert.equal((await cr.verifyTransfer(id, good)).ok, true);
  const row = (await db.query(`SELECT a.status, a.community_transfer_signature, l.status AS ls, l.transfer_verified FROM creator_reward_allocations a JOIN community_fund_ledger l ON l.source_allocation_id = a.id WHERE a.id = $1`, [id])).rows[0];
  assert.equal(row.status, "transferred"); assert.equal(row.ls, "confirmed"); assert.equal(row.transfer_verified, true); assert.equal(row.community_transfer_signature, good);
  assert.equal((await cr.verifyTransfer(id + 0, good)).ok, true, "re-verifying the same transfer is a no-op");
});

test("Community Fund is disabled by default and spending is refused", async () => {
  const pub = await T.client().get("/api/launchpad/info");
  assert.equal(pub.body.communityFund.enabled, false);
  assert.match(pub.body.communityFund.disclosure, /does not provide equity, dividends, revenue share/);
  const a = T.client(); await walletLogin(a, ADMIN);
  const r = await a.post("/api/admin/community/spends", { programId: 1, recipient: OTHER, amountBaseUnits: "1", signature: sig(), reason: "test spend" });
  assert.equal(r.status, 403); assert.equal(r.body.error.code, "fund_disabled");
  const ov = await a.get("/api/admin/community/overview");
  assert.equal(ov.status, 200); assert.equal(ov.body.config.enabled, false);
});

test("the server has no way to sign or send Community Fund transfers", () => {
  const src = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? src(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []));
  for (const f of src(path.join(__dirname, "..", "server"))) {
    const s = fs.readFileSync(f, "utf8");
    assert.ok(!/Keypair\.fromSecretKey|fromSeed|REWARDS_WALLET_SECRET\s*\)/.test(s.replace(/\/\/.*$/gm, "")), `${path.basename(f)} must not load a signer`);
  }
  const exported = Object.keys(cr);
  assert.ok(!exported.some((k) => /send|sign|transfer$/i.test(k)), exported.join(","));
});
