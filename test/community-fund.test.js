"use strict";
// Creator-reward Community Fund: operator-coin matching, detection, 20/80 integer allocation, idempotency,
// rejection/reversal, multisig transfer verification, programs/grants gating, RBAC, and the
// "no funds move from this server" guarantees. Solana RPC is stubbed.
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
const READER = wallet(); // allowlisted admin with no Community Fund roles
const COIN = Keypair.generate().publicKey.toBase58();   // TEK CITY-operated coin (approved below)
const CLIENT_COIN = Keypair.generate().publicKey.toBase58(); // a player's coin: never eligible
let T; const origRpc = sol.rpc;
const chain = { finalized: new Map(), confirmed: new Map() };
const sig = () => Buffer.from(Keypair.generate().secretKey).toString("hex").slice(0, 88).replace(/[0OIl]/g, "A").replace(/[^1-9A-HJ-NP-Za-km-z]/g, "B");

// A parsed transaction where `keys[i]` changes by `deltas[i]` lamports. `mint` adds a token balance for that coin
// (held by some other account), which is how a Pump.fun creator-reward claim references its coin.
function ptx({ keys, deltas, program = PUMP, err = null, fee = 5000, slot = 1000, mint = COIN }) {
  const pre = keys.map(() => 10_000_000_000), post = pre.map((p, i) => p + (deltas[i] || 0) - (i === 0 ? fee : 0));
  const tb = mint ? [{ accountIndex: 0, mint, owner: OTHER, uiTokenAmount: { amount: "1000" } }] : [];
  return { slot, blockTime: 1_760_000_000, transaction: { message: { accountKeys: keys.map((k) => ({ pubkey: k })), instructions: [{ programId: program }] } },
    meta: { err, fee, preBalances: pre, postBalances: post, preTokenBalances: tb, postTokenBalances: tb, innerInstructions: [] } };
}
const reward = (lamports, o = {}) => ptx({ keys: [OTHER, OP], deltas: [-lamports, lamports], ...o });

let admin;
before(async () => {
  T = await boot({ FEATURE_LAUNCHPAD: "true", SOLANA_NETWORK: "mainnet-beta", ADMIN_WALLET_ALLOWLIST: `${ADMIN.address},${READER.address}`, OPERATOR_CREATOR_REWARD_WALLET: OP, COMMUNITY_TREASURY_WALLET: TREASURY,
    ADMIN_WALLET_ROLES: `${ADMIN.address}:coin_approver|policy_admin|program_admin|grant_approver|ledger_reconciler` });
  sol.rpc = async (method, params) => {
    if (method === "getTransaction") return params[1].commitment === "finalized" ? chain.finalized.get(params[0]) || null : chain.confirmed.get(params[0]) || chain.finalized.get(params[0]) || null;
    if (method === "getSignaturesForAddress") return [...new Set([...chain.confirmed.keys(), ...chain.finalized.keys()])].map((signature) => ({ signature }));
    throw new Error(`unexpected rpc ${method}`);
  };
  admin = T.client(); await walletLogin(admin, ADMIN);
  const c = await admin.post("/api/admin/community/coins", { mint: COIN, tokenName: "TEK CITY Ops", tokenSymbol: "TEKOP", launchVenue: "pump.fun" });
  assert.equal(c.status, 200, JSON.stringify(c.body));
  assert.equal((await admin.post(`/api/admin/community/coins/${c.body.id}/status`, { status: "approved" })).status, 200);
  assert.equal((await admin.post(`/api/admin/community/coins/${c.body.id}/status`, { status: "active" })).status, 200);
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
  assert.ok(load({ ...base, OPERATOR_CREATOR_REWARD_WALLET: "not-a-key" }).communityFund.errors.some((e) => /OPERATOR_CREATOR_REWARD_WALLET/.test(e)));
  assert.ok(load({ ...base, REWARDS_WALLET_SECRET: "x" }).communityFund.errors.some((e) => /REWARDS_WALLET_SECRET/.test(e)));
  const ok = load({ ...base, OPERATOR_CREATOR_REWARD_WALLET: OP, COMMUNITY_TREASURY_WALLET: TREASURY }).communityFund;
  assert.equal(ok.enabled, false); assert.equal(ok.accounting, true); assert.equal(ok.communityBps, 2000); assert.equal(ok.operatorBps, 8000);
  const bad = load({ ...base, OPERATOR_CREATOR_REWARD_WALLET: OP, COMMUNITY_TREASURY_WALLET: OP, COMMUNITY_FUND_ENABLED: "true" }).communityFund;
  assert.equal(bad.enabled, false, "invalid config fails safe to disabled");
});

test("a finalized 1.00 SOL reward on an approved operator coin allocates 0.20 / 0.80", async () => {
  const s = sig(); chain.finalized.set(s, reward(1_000_000_000));
  const out = await cr.processSignature(s);
  assert.equal(out.results[0].status, "confirmed");
  const ev = (await db.query(`SELECT * FROM creator_reward_events WHERE source_transaction_signature = $1`, [s])).rows[0];
  assert.equal(ev.asset_mint, "SOL"); assert.equal(ev.reward_amount_base_units, "1000000000"); assert.equal(ev.reward_recipient_wallet, OP);
  assert.ok(ev.operator_coin_id); assert.match(ev.raw_event_hash_or_reference, /^[0-9a-f]{64}$/);
  const al = (await db.query(`SELECT * FROM creator_reward_allocations WHERE creator_reward_event_id = $1`, [ev.id])).rows[0];
  assert.equal(al.community_fund_amount_base_units, "200000000"); assert.equal(al.operator_retained_amount_base_units, "800000000");
  assert.equal(al.allocation_status, "calculated"); assert.equal(al.community_treasury_wallet, TREASURY);
  const led = (await db.query(`SELECT * FROM community_fund_ledger WHERE source_allocation_id = $1`, [al.id])).rows[0];
  assert.equal(led.status, "accrued"); assert.equal(led.transfer_verified, false); assert.equal(led.transaction_signature, null);
});

test("a client's own coin reward is never ingested", async () => {
  const a0 = await count("creator_reward_allocations");
  // reward for a player's coin landing in the operator wallet: coin isn't an operator coin -> rejected
  const s = sig(); chain.finalized.set(s, reward(400_000_000, { mint: CLIENT_COIN }));
  const r = await cr.processSignature(s);
  assert.equal(r.results[0].status, "rejected"); assert.equal(r.results[0].reason, "not_an_eligible_operator_coin");
  // reward paid to the player's own wallet: the operator wallet isn't involved at all
  const p = sig(); chain.finalized.set(p, ptx({ keys: [OTHER, wallet().address], deltas: [-400_000_000, 400_000_000], mint: CLIENT_COIN }));
  assert.equal((await cr.processSignature(p)).skipped, "operator_wallet_not_involved");
  assert.equal(await count("creator_reward_allocations"), a0);
});

test("unapproved (draft) operator coins are rejected until an admin activates them", async () => {
  const mint = Keypair.generate().publicKey.toBase58();
  const c = await admin.post("/api/admin/community/coins", { mint, tokenName: "Draft Coin", tokenSymbol: "DRAFT", launchVenue: "pump.fun" });
  assert.equal(c.status, 200);
  const s = sig(); chain.finalized.set(s, reward(100_000_000, { mint }));
  const r = await cr.processSignature(s);
  assert.equal(r.results[0].status, "rejected");
  assert.equal((await admin.post(`/api/admin/community/coins/${c.body.id}/status`, { status: "active" })).status, 409, "draft can't jump to active");
});

test("unmatched rewards wait for an admin match and never allocate on their own", async () => {
  const a0 = await count("creator_reward_allocations");
  const s = sig(); chain.finalized.set(s, reward(90_000_000, { mint: null }));
  const r = await cr.processSignature(s);
  assert.equal(r.results[0].status, "detected"); assert.equal(await count("creator_reward_allocations"), a0);
  const ev = (await db.query(`SELECT id, rejection_reason FROM creator_reward_events WHERE source_transaction_signature = $1`, [s])).rows[0];
  assert.equal(ev.rejection_reason, "awaiting_operator_coin_match");
  const coin = (await db.query(`SELECT id FROM operator_coins WHERE mint_address_or_launch_id = $1`, [COIN])).rows[0];
  const m = await admin.post(`/api/admin/community/events/${ev.id}/match`, { operatorCoinId: Number(coin.id) });
  assert.equal(m.status, 200, JSON.stringify(m.body));
  assert.equal(await count("creator_reward_allocations"), a0 + 1);
});

test("operator claiming its own reward counts the fee it paid back in", async () => {
  const s = sig(); chain.finalized.set(s, ptx({ keys: [OP], deltas: [500_000_000], fee: 5000 }));
  await cr.processSignature(s);
  const ev = (await db.query(`SELECT reward_amount_base_units FROM creator_reward_events WHERE source_transaction_signature = $1`, [s])).rows[0];
  assert.equal(ev.reward_amount_base_units, "500000000");
});

test("no allocation until the receipt is finalized", async () => {
  const s = sig(); const t = reward(300_000_000);
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
  const s = sig(); chain.finalized.set(s, reward(100_000_000));
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
  const n = sig(); chain.finalized.set(n, reward(2_000_000_000, { program: SYSTEM }));
  assert.equal((await cr.processSignature(n)).skipped, "not_a_creator_reward");
  assert.equal((await cr.processSignature("not-a-signature")).skipped, "bad_signature");
  assert.equal(await count("creator_reward_allocations"), a0);
});

test("reversed rewards reverse their allocation and ledger row; amounts are immutable", async () => {
  const s = sig(); chain.finalized.set(s, reward(50_000_000));
  await cr.processSignature(s);
  const ev = (await db.query(`SELECT id FROM creator_reward_events WHERE source_transaction_signature = $1`, [s])).rows[0];
  const rv = await admin.post(`/api/admin/community/events/${ev.id}/reverse`, { reason: "ineligible source" });
  assert.equal(rv.status, 200);
  const al = (await db.query(`SELECT a.allocation_status, l.status AS ls FROM creator_reward_allocations a JOIN community_fund_ledger l ON l.source_allocation_id = a.id WHERE a.creator_reward_event_id = $1`, [ev.id])).rows[0];
  assert.equal(al.allocation_status, "reversed"); assert.equal(al.ls, "reversed");
  await assert.rejects(db.query(`UPDATE creator_reward_allocations SET community_fund_amount_base_units = 1 WHERE creator_reward_event_id = $1`, [ev.id]), /immutable/);
  await assert.rejects(db.query(`DELETE FROM community_fund_ledger`), /append-only/);
  await assert.rejects(db.query(`DELETE FROM audit_logs`), /append-only|audit/i);
});

test("transfer: propose -> human multisig send -> verified on chain (confirmed = transferred, finalized = verified)", async () => {
  const s = sig(); chain.finalized.set(s, reward(1_000_000_000));
  const out = await cr.processSignature(s); const id = out.results[0].allocation.id;
  const p = await admin.post(`/api/admin/community/allocations/${id}/propose-transfer`, {});
  assert.equal(p.status, 200); assert.equal(p.body.proposal.amountBaseUnits, "200000000"); assert.equal(p.body.proposal.to, TREASURY);
  assert.equal((await db.query(`SELECT status FROM community_fund_ledger WHERE source_allocation_id = $1`, [id])).rows[0].status, "transfer_proposed");
  const short = sig(); chain.finalized.set(short, ptx({ keys: [OP, TREASURY], deltas: [-100_000_000, 100_000_000], program: SYSTEM, mint: null }));
  assert.equal((await cr.verifyTransfer(id, short)).code, "amount_short");
  const wrongTo = sig(); chain.finalized.set(wrongTo, ptx({ keys: [OP, OTHER], deltas: [-200_000_000, 200_000_000], program: SYSTEM, mint: null }));
  assert.equal((await cr.verifyTransfer(id, wrongTo)).ok, false);
  const good = sig(); const gt = ptx({ keys: [OP, TREASURY], deltas: [-200_000_000, 200_000_000], program: SYSTEM, mint: null });
  chain.confirmed.set(good, gt);
  const v1 = await admin.post(`/api/admin/community/allocations/${id}/verify-transfer`, { signature: good });
  assert.equal(v1.status, 200); assert.equal(v1.body.status, "transferred");
  let pub = await T.client().get("/api/community-fund");
  assert.ok(!pub.body.transfers.some((x) => x.signature === good), "not public until finalized");
  chain.finalized.set(good, gt);
  const v2 = await cr.verifyTransfer(id, good);
  assert.equal(v2.status, "verified");
  const row = (await db.query(`SELECT a.allocation_status, a.transfer_verified_at, l.status AS ls, l.transfer_verified FROM creator_reward_allocations a JOIN community_fund_ledger l ON l.source_allocation_id = a.id WHERE a.id = $1`, [id])).rows[0];
  assert.equal(row.allocation_status, "verified"); assert.ok(row.transfer_verified_at); assert.equal(row.ls, "verified"); assert.equal(row.transfer_verified, true);
  pub = await T.client().get("/api/community-fund");
  assert.ok(pub.body.transfers.some((x) => x.signature === good));
  const other = sig(); chain.finalized.set(other, reward(10_000_000)); const o = await cr.processSignature(other);
  assert.equal((await cr.verifyTransfer(o.results[0].allocation.id, good)).code, "signature_used");
});

test("public page: Not Active, separate totals, wallets from server config, disclosures, no fake signatures", async () => {
  const r = await T.client().get("/api/community-fund");
  assert.equal(r.status, 200);
  assert.equal(r.body.status, "not_active"); assert.equal(r.body.enabled, false);
  assert.equal(r.body.operatorWallet, OP); assert.equal(r.body.treasuryWallet, TREASURY);
  for (const k of ["creatorRewardsVerified", "fundAccrued", "fundTransferred", "fundVerifiedAtTreasury", "rewardsCommitted", "rewardsPaid", "rewardsAvailable"]) assert.ok(Array.isArray(r.body.totals[k]), k);
  assert.match(r.body.disclosure, /20% of verified creator rewards it actually receives/);
  assert.match(r.body.policies.token_utility_disclosure.text, /game utility only/);
  for (const t of r.body.transfers) assert.ok(chain.finalized.has(t.signature), "every public signature exists on chain");
  const page = await T.client().get("/community-fund");
  assert.equal(page.status, 200);
  const js = fs.readFileSync(path.join(__dirname, "..", "client", "landing.js"), "utf8") + fs.readFileSync(path.join(__dirname, "..", "client", "pages.js"), "utf8");
  assert.ok(!js.includes("6VP6fsgX1hbvvKzrhJcFEAuVhrQneL64SmkUQaugpLaR") && !js.includes("H7QogRhBLXzQo6ixt12dC15FXTMhoatLid27iK5ZKwpX"), "no hard-coded wallets in frontend");
});

test("disabled flag blocks program activation, grants and payments", async () => {
  const pr = await admin.post("/api/admin/community/programs", { name: "Board Contest", purpose: "gameplay_contest", description: "Weekly board contest for active players.", eligibilityRules: "Top 3 by spaces held at week end.", fraudControls: "One wallet per player, sybil review.", assetMint: "SOL", budgetBaseUnits: "1000000000", startsAt: new Date(Date.now() - 3600e3).toISOString(), endsAt: new Date(Date.now() + 86400e3).toISOString() });
  assert.equal(pr.status, 200, JSON.stringify(pr.body));
  for (const st of ["proposed", "approved"]) assert.equal((await admin.post(`/api/admin/community/programs/${pr.body.id}/status`, { status: st })).status, 200);
  const act = await admin.post(`/api/admin/community/programs/${pr.body.id}/status`, { status: "active" });
  assert.equal(act.status, 409, JSON.stringify(act.body)); assert.equal(act.body.error.code, "fund_disabled");
  const g = await admin.post("/api/admin/community/grants", { programId: Number(pr.body.id), recipient: wallet().address, amountBaseUnits: "1000", proof: "contest-week-1" });
  assert.equal(g.status, 409); assert.equal(g.body.error.code, "fund_disabled");
  assert.equal((await cr.verifyGrantPayment(1, sig(), null)).code, "fund_disabled");
});

test("grants are refused outside an active program (enabled fund)", async () => {
  const cf = T.config.communityFund; cf.enabled = true;
  try {
    const mk = (o = {}) => admin.post("/api/admin/community/programs", { name: "Bug bounty", purpose: "bug_bounty", description: "Reward verified security reports.", eligibilityRules: "Valid, reproducible, in-scope report.", fraudControls: "Manual triage, one payout per issue.", assetMint: "SOL", budgetBaseUnits: "5000", startsAt: new Date(Date.now() - 3600e3).toISOString(), endsAt: new Date(Date.now() + 86400e3).toISOString(), ...o });
    const p = Number((await mk()).body.id);
    const rec = wallet().address;
    let g = await admin.post("/api/admin/community/grants", { programId: p, recipient: rec, amountBaseUnits: "1000", proof: "report-001" });
    assert.equal(g.body.error.code, "no_program", JSON.stringify(g.body));
    for (const st of ["proposed", "approved", "active"]) assert.equal((await admin.post(`/api/admin/community/programs/${p}/status`, { status: st })).status, 200);
    g = await admin.post("/api/admin/community/grants", { programId: p, recipient: rec, amountBaseUnits: "6000", proof: "report-002" });
    assert.equal(g.body.error.code, "over_budget");
    g = await admin.post("/api/admin/community/grants", { programId: p, recipient: TREASURY, amountBaseUnits: "10", proof: "report-003" });
    assert.equal(g.status, 400, "no grants to TEK CITY wallets");
    g = await admin.post("/api/admin/community/grants", { programId: p, recipient: rec, amountBaseUnits: "1000", proof: "report-004" });
    assert.equal(g.status, 200);
    const gid = Number(g.body.id);
    const paid0 = await cr.verifyGrantPayment(gid, sig(), null); assert.equal(paid0.code, "bad_status", "must be approved + proposed first");
    for (const st of ["approved", "payment_proposed"]) assert.equal((await admin.post(`/api/admin/community/grants/${gid}/status`, { status: st })).status, 200);
    const pay = sig(); chain.finalized.set(pay, ptx({ keys: [TREASURY, rec], deltas: [-1000, 1000], program: SYSTEM, mint: null }));
    const v = await admin.post(`/api/admin/community/grants/${gid}/verify-payment`, { signature: pay });
    assert.equal(v.status, 200, JSON.stringify(v.body));
    const pub = await T.client().get("/api/community-fund");
    assert.ok(pub.body.payouts.some((x) => x.signature === pay));
    // expired program
    const old = Number((await mk({ startsAt: new Date(Date.now() - 3 * 86400e3).toISOString(), endsAt: new Date(Date.now() - 86400e3).toISOString() })).body.id);
    for (const st of ["proposed", "approved", "active"]) await admin.post(`/api/admin/community/programs/${old}/status`, { status: st });
    g = await admin.post("/api/admin/community/grants", { programId: old, recipient: rec, amountBaseUnits: "10", proof: "late-entry" });
    assert.equal(g.body.error.code, "outside_dates");
  } finally { cf.enabled = false; }
});

test("RBAC: admins without a role can't touch Community Fund records", async () => {
  const a = T.client(); await walletLogin(a, READER);
  for (const [p, b] of [["/api/admin/community/coins", { mint: Keypair.generate().publicKey.toBase58(), tokenName: "X", tokenSymbol: "X", launchVenue: "pump.fun" }], ["/api/admin/community/rescan", {}], ["/api/admin/community/policies", { key: "community_fund_model", version: "x.1", body: "A new policy text that is long enough." }]]) {
    const r = await a.post(p, b);
    assert.equal(r.status, 403, p); assert.equal(r.body.error.code, "missing_role");
  }
  assert.equal((await a.get("/api/admin/community/overview")).status, 403);
  assert.equal((await T.client().get("/api/admin/community/overview")).status === 200, false);
});

test("holding TEK CITY gives no entitlement to Community Fund assets", async () => {
  const s = JSON.stringify((await T.client().get("/api/community-fund")).body);
  assert.match(s, /do not provide equity, dividends, revenue share, profit rights, ownership of Community Fund assets/);
  const src = fs.readFileSync(path.join(__dirname, "..", "server", "chain", "creatorRewards.js"), "utf8");
  assert.ok(!/holder|balanceOf|getTokenAccountsByOwner/i.test(src.replace(/\/\/.*$/gm, "")), "fund logic never looks at token holders");
});

test("the server has no way to sign or send Community Fund transfers", () => {
  const src = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? src(path.join(d, e.name)) : e.name.endsWith(".js") ? [path.join(d, e.name)] : []));
  for (const f of src(path.join(__dirname, "..", "server"))) {
    const s = fs.readFileSync(f, "utf8").replace(/\/\/.*$/gm, "");
    assert.ok(!/Keypair\.fromSecretKey|Keypair\.fromSeed|sendTransaction|sendRawTransaction/.test(s) || /chain\/solana\.js$/.test(f), `${path.basename(f)} must not load a signer or send`);
  }
  const exported = Object.keys(cr);
  assert.ok(!exported.some((k) => /^(send|sign)/i.test(k)), exported.join(","));
});
