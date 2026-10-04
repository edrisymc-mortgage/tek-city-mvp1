"use strict";
// One-tap fund ops: the server builds unsigned transactions, a wallet signs them, the server verifies and records.
// Covers the 20% cap, the operator -> treasury sweep, and player payouts from game earnings. Solana RPC is stubbed.
const { test, before, after } = require("node:test");
const assert = require("node:assert");
const { Keypair, VersionedTransaction } = require("@solana/web3.js");
const nacl = require("tweetnacl");
const { boot, wallet, walletLogin } = require("./helpers");
const { load } = require("../server/config");
const sol = require("../server/chain/solana");
const cr = require("../server/chain/creatorRewards");
const ops = require("../server/chain/fundOps");
const rewards = require("../server/game/rewards");
const db = require("../server/db/pool");

const OPK = Keypair.generate(), TRK = Keypair.generate();
const OP = OPK.publicKey.toBase58(), TREASURY = TRK.publicKey.toBase58();
const SYSTEM = "11111111111111111111111111111111";
let T; const orig = { rpc: sol.rpc, send: sol.send, waitFor: sol.waitFor, sigStatus: sol.sigStatus, bal: sol.solBalance };
const chain = new Map(); // signature -> parsed tx
const status = new Map(); // signature -> state

function signB64(b64, kp) {
  const tx = VersionedTransaction.deserialize(Buffer.from(b64, "base64"));
  tx.signatures[0] = nacl.sign.detached(tx.message.serialize(), kp.secretKey);
  return Buffer.from(tx.serialize()).toString("base64");
}
// Parsed result of a SystemProgram transfer batch `from` -> [{to, lamports}].
function parsedTransfer(from, outs, slot = 2000) {
  const keys = [from, ...outs.map((o) => o.to), SYSTEM];
  const total = outs.reduce((s, o) => s + Number(o.lamports), 0);
  const pre = keys.map(() => 50_000_000_000), post = pre.map((p, i) => (i === 0 ? p - total - 5000 : i <= outs.length ? p + Number(outs[i - 1].lamports) : p));
  return { slot, blockTime: 1_760_000_000, transaction: { message: { accountKeys: keys.map((k) => ({ pubkey: k })), instructions: [{ programId: SYSTEM }] } },
    meta: { err: null, fee: 5000, preBalances: pre, postBalances: post, preTokenBalances: [], postTokenBalances: [], innerInstructions: [] } };
}

before(async () => {
  T = await boot({ FEATURE_LAUNCHPAD: "true", SOLANA_NETWORK: "mainnet-beta", OPERATOR_CREATOR_REWARD_WALLET: OP, COMMUNITY_TREASURY_WALLET: TREASURY, COMMUNITY_FUND_ENABLED: "true" });
  sol.rpc = async (method, params) => {
    if (method === "getLatestBlockhash") return { value: { blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 1 } };
    if (method === "getTransaction") { const t = chain.get(params[0]); if (!t) return null; return params[1].commitment === "finalized" && status.get(params[0]) !== "finalized" ? null : t; }
    if (method === "getSignaturesForAddress") return [];
    throw new Error(`unexpected rpc ${method}`);
  };
  sol.solBalance = async () => 100_000_000_000;
  sol.send = async () => "ok";
  sol.sigStatus = async (s) => ({ state: status.get(s) || "unknown" });
  sol.waitFor = async (s) => ({ state: status.get(s) || "confirmed" });
});
after(async () => { Object.assign(sol, { rpc: orig.rpc, send: orig.send, waitFor: orig.waitFor, sigStatus: orig.sigStatus, solBalance: orig.bal }); await T.close(); });

test("the Community Fund share can never be set above 20%", () => {
  const base = { NODE_ENV: "test", SESSION_SECRET: "t".repeat(48), OPERATOR_CREATOR_REWARD_WALLET: OP, COMMUNITY_TREASURY_WALLET: TREASURY, COMMUNITY_FUND_ENABLED: "true" };
  const bad = load({ ...base, COMMUNITY_FUND_ALLOCATION_BPS: "2500", OPERATOR_REWARD_RETAINED_BPS: "7500" }).communityFund;
  assert.ok(bad.errors.some((e) => /2000 \(20%\)/.test(e))); assert.equal(bad.enabled, false); assert.equal(bad.accounting, false);
  const lower = load({ ...base, COMMUNITY_FUND_ALLOCATION_BPS: "1000", OPERATOR_REWARD_RETAINED_BPS: "9000" }).communityFund;
  assert.equal(lower.errors.length, 0); assert.equal(lower.communityBps, 1000);
});

test("payout plan splits by category and weight, drops dust, caps recipients", () => {
  const pending = [
    { id: 1, wallet: "A", category: "leaderboard", weight: 5 }, { id: 2, wallet: "B", category: "leaderboard", weight: 3 }, { id: 3, wallet: "C", category: "leaderboard", weight: 2 },
    { id: 4, wallet: "A", category: "vault", weight: 1 }, { id: 5, wallet: "D", category: "milestone", weight: 1 }, { id: 6, wallet: "E", category: "milestone", weight: 1 },
  ];
  const lines = ops.plan({ budget: 1_000_000_000n, pending, split: { leaderboard: 5000, vault: 2500, milestone: 2500 }, minLamports: 1_000_000, maxRecipients: 15 });
  const by = Object.fromEntries(lines.map((l) => [l.wallet, l.lamports]));
  assert.equal(by.A, 250_000_000n + 250_000_000n); assert.equal(by.B, 150_000_000n); assert.equal(by.C, 100_000_000n);
  assert.equal(by.D, 125_000_000n); assert.equal(by.E, 125_000_000n);
  assert.ok(lines.reduce((s, l) => s + l.lamports, 0n) <= 1_000_000_000n);
  assert.equal(ops.plan({ budget: 1_000n, pending, split: { leaderboard: 10000 }, minLamports: 1_000_000, maxRecipients: 15 }).length, 0, "dust waits");
  assert.equal(ops.plan({ budget: 1_000_000_000n, pending, split: { leaderboard: 5000, vault: 2500, milestone: 2500 }, minLamports: 1, maxRecipients: 2 }).length, 2);
});

test("sweep: operator wallet sends exactly the 20% share to the treasury; records only after Solana confirms", async () => {
  await ops.ensureOfficialCoin(); // no mint set: no-op
  const coin = (await db.query(`INSERT INTO operator_coins (mint_address_or_launch_id, token_name, token_symbol, launch_venue, network, operator_reward_wallet, eligibility_status, policy_version, configured_by_admin_id)
     VALUES ($1,'TEK CITY','TEKCITY','pump.fun','mainnet-beta',$2,'active','t','test') RETURNING id`, [Keypair.generate().publicKey.toBase58(), OP])).rows[0];
  const ids = [];
  for (const amt of [1_000_000_000n, 7n, 333_333_333n]) {
    const ev = (await db.query(`INSERT INTO creator_reward_events (operator_coin_id, source_type, source_event_id, source_transaction_signature, reward_recipient_wallet, asset_mint, reward_amount_base_units, received_slot, received_at, verification_status)
       VALUES ($1,'onchain_transfer',$2,$3,$4,'SOL',$5,1,now(),'confirmed') RETURNING *`, [coin.id, `e${amt}`, `s${amt}${Date.now()}`, OP, amt.toString()])).rows[0];
    const a = await db.tx((c) => cr.allocate(c, ev)); ids.push(a.id);
  }
  const want = 200_000_000n + 1n + 66_666_666n; // floor(20%) each
  assert.equal((await ops.buildSweep(TREASURY)).code, "wrong_wallet");
  const b = await ops.buildSweep(OP);
  assert.equal(b.ok, true, JSON.stringify(b)); assert.equal(b.lamports, want.toString());
  assert.equal((await ops.buildSweep(OP)).code, "busy", "one open transfer at a time");
  // the built tx is one transfer, operator -> treasury, for exactly the share
  const rv = sol.review(b.transaction);
  assert.deepEqual(rv.transfers, [{ from: OP, to: TREASURY, lamports: Number(want) }]);
  // a tampered transaction is refused
  const other = Keypair.generate();
  assert.notEqual((await ops.submit(b.opId, signB64(b.transaction, other), OP)).ok, true);
  const signed = signB64(b.transaction, OPK);
  const s = sol.sigOf(VersionedTransaction.deserialize(Buffer.from(signed, "base64")));
  chain.set(s, parsedTransfer(OP, [{ to: TREASURY, lamports: want }])); status.set(s, "confirmed");
  const r = await ops.submit(b.opId, signed, OP);
  assert.equal(r.ok, true, JSON.stringify(r));
  let st = (await db.query(`SELECT allocation_status FROM creator_reward_allocations WHERE id = ANY($1)`, [ids])).rows.map((x) => x.allocation_status);
  assert.deepEqual([...new Set(st)], ["transferred"]);
  status.set(s, "finalized"); await ops.tick(); await cr.tick();
  st = (await db.query(`SELECT allocation_status FROM creator_reward_allocations WHERE id = ANY($1)`, [ids])).rows.map((x) => x.allocation_status);
  assert.deepEqual([...new Set(st)], ["verified"]);
  assert.equal((await ops.buildSweep(OP)).code, "nothing", "nothing left to move");
});

test("payouts: earnings from the leaderboard, Vault and milestones are paid from the treasury after approval", async () => {
  const mk = async () => { const c = T.client(); await c.start(); const w = wallet(); await walletLogin(c, w); return (await db.query(`SELECT user_id FROM wallet_accounts WHERE address = $1`, [w.address])).rows[0].user_id; };
  const [u1, u2, u3] = [await mk(), await mk(), await mk()];
  await db.query(`INSERT INTO player_points (user_id, day, points) VALUES ($1, current_date - 1, 50), ($2, current_date - 1, 30), ($3, current_date - 1, 10)`, [u1, u2, u3]);
  assert.equal(await rewards.finalizeLeaderboards(), 3);
  assert.equal(await rewards.finalizeLeaderboards(), 0, "a day is ranked once");
  await db.tx((c) => rewards.earn(c, u2, "vault", "vault:test", 1));
  await rewards.milestoneReached("m100k");
  assert.equal((await ops.buildPayout(OP)).code, "wrong_wallet");
  const b = await ops.buildPayout(TREASURY);
  assert.equal(b.ok, true, JSON.stringify(b));
  // available = verified at treasury (266,666,667) minus nothing paid; batch = 50%
  const budget = (266_666_667n * 5000n) / 10000n;
  assert.ok(BigInt(b.lamports) <= budget, `${b.lamports} <= ${budget}`);
  assert.ok(b.recipients.length >= 3);
  assert.ok(sol.review(b.transaction).transfers.every((t) => t.from === TREASURY && t.to !== OP && t.to !== TREASURY));
  const signed = signB64(b.transaction, TRK);
  const s = sol.sigOf(VersionedTransaction.deserialize(Buffer.from(signed, "base64")));
  chain.set(s, parsedTransfer(TREASURY, b.recipients.map((x) => ({ to: x.wallet, lamports: BigInt(x.lamports) })))); status.set(s, "confirmed");
  assert.equal((await ops.submit(b.opId, signed, TREASURY)).ok, true);
  let paid = Number((await db.query(`SELECT count(*) AS n FROM community_reward_grants WHERE status = 'paid'`)).rows[0].n);
  assert.equal(paid, 0, "not paid until finalized");
  status.set(s, "finalized"); await ops.tick();
  paid = Number((await db.query(`SELECT count(*) AS n FROM community_reward_grants WHERE status = 'paid'`)).rows[0].n);
  assert.equal(paid, b.recipients.length);
  const mine = await rewards.mine(u1);
  assert.ok(mine.paid.length >= 1 && mine.paid[0].signature === s);
  assert.equal((await ops.buildPayout(TREASURY)).code, "nothing", "everything earned so far was paid");
});

test("an unsigned payout that expires releases its earnings for the next batch", async () => {
  const c = T.client(); await c.start(); const w = wallet(); await walletLogin(c, w);
  const uid = (await db.query(`SELECT user_id FROM wallet_accounts WHERE address = $1`, [w.address])).rows[0].user_id;
  await db.tx((cc) => rewards.earn(cc, uid, "vault", "vault:exp", 1));
  const b = await ops.buildPayout(TREASURY);
  assert.equal(b.ok, true, JSON.stringify(b));
  await db.query(`UPDATE fund_ops SET created_at = now() - interval '10 minutes' WHERE id = $1`, [b.opId]);
  await ops.tick();
  assert.equal((await db.query(`SELECT status FROM fund_ops WHERE id = $1`, [b.opId])).rows[0].status, "expired");
  assert.equal((await db.query(`SELECT grant_id FROM player_earnings WHERE ref = 'vault:exp'`)).rows[0].grant_id, null);
});
