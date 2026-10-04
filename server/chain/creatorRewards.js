"use strict";
// Creator-reward Community Fund accounting.
//
// Scope
//   Only creator rewards that TEK CITY's own OPERATOR_CREATOR_REWARD_WALLET actually receives, for coins recorded in
//   operator_coins and approved by an admin (eligibility_status = 'active'), count. Players' coins, launches, buys,
//   trading volume and wallet balances are never part of this. A player's own creator rewards belong to that player.
//
// Flow
//   1. detect   read the operator wallet's transactions through SOLANA_RPC_URL (never from browser input)
//   2. verify   success, finalized, Pump.fun program involved, recipient = operator wallet, asset + amount from chain,
//               coin matched to an active operator coin on the configured network
//   3. record   one immutable creator_reward_event per (transaction, asset)
//   4. allocate only when confirmed: community = floor(amount * 2000 / 10000), operator = amount - community
//               (integer base units; the division remainder stays with the operator)
//   5. ledger   community_fund_ledger row 'accrued' = accounting only, NOT funded
//   6. propose  an admin records a transfer proposal; a human sends it from their own wallet / multisig
//   7. verify   the public signature is checked on chain; only then 'transferred' (confirmed) / 'verified' (finalized)
//
// This module cannot sign or send anything. The server holds no key for any wallet.
const crypto = require("crypto");
const db = require("../db/pool");
const sol = require("./solana");
const { audit } = require("../audit");

// Programs whose payouts count as creator rewards (Pump.fun bonding curve, PumpSwap AMM, Pump fee program).
const REWARD_PROGRAMS = new Set([
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
  "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ",
]);
const NATIVE = "SOL";
const WSOL = "So11111111111111111111111111111111111111112";
const SIG_RE = /^[1-9A-HJ-NP-Za-km-z]{64,100}$/;

let CFG = null;
function configure(config) { CFG = config; }
const F = () => CFG.communityFund;
const NET = () => CFG.solana.network;

function split(amount, communityBps) {
  const a = BigInt(amount), bps = BigInt(communityBps);
  if (a <= 0n) throw new Error("amount must be positive");
  if (bps < 0n || bps > 10000n) throw new Error("bad bps");
  const community = (a * bps) / 10000n; // BigInt division floors for non-negative values
  return { community, operator: a - community };
}

const keyOf = (k) => (typeof k === "string" ? k : k && (k.pubkey && (k.pubkey.toBase58 ? k.pubkey.toBase58() : k.pubkey)));
const keysOf = (tx) => ((tx.transaction && tx.transaction.message && tx.transaction.message.accountKeys) || []).map(keyOf);
function programsIn(tx) {
  const ids = new Set(), keys = keysOf(tx), m = tx.transaction && tx.transaction.message;
  const add = (ix) => { const id = ix.programId || (ix.programIdIndex != null ? keys[ix.programIdIndex] : null); if (id) ids.add(String(id)); };
  for (const ix of (m && m.instructions) || []) add(ix);
  for (const inner of (tx.meta && tx.meta.innerInstructions) || []) for (const ix of inner.instructions || []) add(ix);
  return ids;
}
function wellFormed(tx) {
  return !!(tx && tx.meta && Array.isArray(tx.meta.preBalances) && Array.isArray(tx.meta.postBalances) && tx.meta.preBalances.length === tx.meta.postBalances.length && keysOf(tx).length === tx.meta.preBalances.length && Number.isInteger(tx.slot));
}

// Net increase per asset for `wallet`. Native SOL adds back the fee the wallet paid (a creator claiming its own rewards).
function receipts(tx, wallet) {
  const out = [], keys = keysOf(tx), i = keys.indexOf(wallet);
  if (i >= 0) {
    let d = BigInt(tx.meta.postBalances[i]) - BigInt(tx.meta.preBalances[i]);
    if (i === 0) d += BigInt(tx.meta.fee || 0);
    if (d > 0n) out.push({ asset: NATIVE, amount: d });
  }
  const sum = (list) => { const m = new Map(); for (const b of list || []) if (b.owner === wallet) m.set(b.mint, (m.get(b.mint) || 0n) + BigInt(b.uiTokenAmount.amount)); return m; };
  const pre = sum(tx.meta.preTokenBalances), post = sum(tx.meta.postTokenBalances);
  for (const [mint, v] of post) { const d = v - (pre.get(mint) || 0n); if (d > 0n) out.push({ asset: mint, amount: d }); }
  return out;
}
function coinMintsOf(tx) {
  return [...new Set([...(tx.meta.preTokenBalances || []), ...(tx.meta.postTokenBalances || [])].map((b) => b.mint).filter((m) => m && m !== WSOL))];
}
const hashTx = (tx) => crypto.createHash("sha256").update(JSON.stringify({ slot: tx.slot, keys: keysOf(tx), meta: { err: tx.meta.err, fee: tx.meta.fee, pre: tx.meta.preBalances, post: tx.meta.postBalances, preT: tx.meta.preTokenBalances, postT: tx.meta.postTokenBalances } })).digest("hex");

async function fetchTx(signature, commitment) {
  return sol.rpc("getTransaction", [signature, { encoding: "jsonParsed", commitment, maxSupportedTransactionVersion: 0 }]);
}

async function activeOperatorCoin(c, mint) {
  return (await c.query(`SELECT * FROM operator_coins WHERE mint_address_or_launch_id = $1 AND eligibility_status = 'active' AND network = $2 AND operator_reward_wallet = $3`,
    [mint, NET(), F().operatorWallet])).rows[0] || null;
}

async function reject(eventId, signature, asset, tx, reason, amount = 0n) {
  const r = await db.query(
    `INSERT INTO creator_reward_events (operator_coin_id, source_type, source_event_id, source_transaction_signature, reward_recipient_wallet, asset_mint, reward_amount_base_units, received_slot, received_at, verification_status, rejection_reason, raw_event_hash_or_reference)
     VALUES (NULL,'onchain_transfer',$1,$2,$3,$4,$9,$5,to_timestamp($6),'rejected',$7,$8) ON CONFLICT DO NOTHING RETURNING id`,
    [eventId, signature, F().operatorWallet, asset, tx ? tx.slot : null, (tx && tx.blockTime) || 0, reason, tx ? hashTx(tx) : null, String(amount)]);
  if (r.rows[0]) await audit(null, { action: "community.event_rejected", target: signature, details: { eventId, reason } });
  return { eventId, status: "rejected", reason };
}

// Process one operator-wallet signature. Idempotent: safe to call repeatedly or concurrently.
async function processSignature(signature, { operatorCoinId = null, actor = null } = {}) {
  if (!F().accounting) return { skipped: "not_configured" };
  if (!SIG_RE.test(String(signature))) return { skipped: "bad_signature" };
  let fin, tx;
  try { fin = await fetchTx(signature, "finalized"); tx = fin || (await fetchTx(signature, "confirmed")); }
  catch (e) { return { skipped: "rpc_error", error: String(e.message).slice(0, 120) }; } // retried on the next tick
  if (!tx) return { skipped: "not_found" };
  if (!wellFormed(tx)) return reject(`${signature}:malformed`, signature, "unknown", null, "malformed_transaction");
  if (![...programsIn(tx)].some((p) => REWARD_PROGRAMS.has(p))) return { skipped: "not_a_creator_reward" };
  if (!keysOf(tx).includes(F().operatorWallet)) return { skipped: "operator_wallet_not_involved" };
  if (tx.meta.err) return { signature, results: [await reject(`${signature}:${NATIVE}`, signature, NATIVE, tx, "transaction_failed")] };
  const got = receipts(tx, F().operatorWallet);
  if (!got.length) return { skipped: "no_receipt" };
  const mints = coinMintsOf(tx);
  const results = [];
  for (const r of got) {
    const eventId = `${signature}:${r.asset}`;
    if (r.asset !== NATIVE && r.asset !== WSOL && !mints.includes(r.asset)) { results.push(await reject(eventId, signature, r.asset, tx, "unsupported_reward_asset", r.amount)); continue; }
    const out = await db.tx(async (c) => {
      // Coin match: explicit admin match (verified claim) or the single non-SOL mint in the transaction.
      let coin = null, reason = null;
      if (operatorCoinId) {
        coin = (await c.query(`SELECT * FROM operator_coins WHERE id = $1 AND eligibility_status = 'active' AND network = $2 AND operator_reward_wallet = $3`, [operatorCoinId, NET(), F().operatorWallet])).rows[0] || null;
        if (!coin) reason = "operator_coin_not_active";
      } else if (mints.length === 1) {
        coin = await activeOperatorCoin(c, mints[0]);
        if (!coin) reason = "not_an_eligible_operator_coin";
      } else reason = "awaiting_operator_coin_match";
      if (reason && reason !== "awaiting_operator_coin_match") return { reject: reason };
      const status = coin && fin ? "confirmed" : "detected";
      const ins = await c.query(
        `INSERT INTO creator_reward_events (operator_coin_id, source_type, source_event_id, source_transaction_signature, reward_recipient_wallet, asset_mint, reward_amount_base_units, received_slot, received_at, verification_status, rejection_reason, raw_event_hash_or_reference)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,to_timestamp($9),$10,$11,$12) ON CONFLICT DO NOTHING RETURNING id`,
        [coin ? coin.id : null, operatorCoinId ? "verified_claim" : "onchain_transfer", eventId, signature, F().operatorWallet, r.asset, r.amount.toString(), tx.slot, tx.blockTime || 0, status, coin ? null : reason, hashTx(tx)]);
      if (ins.rows[0]) await audit(c, { actorWallet: actor, action: "community.event_ingested", target: signature, details: { eventId, status, amount: r.amount.toString(), asset: r.asset, coin: coin && coin.id } });
      const ev = (await c.query(`SELECT * FROM creator_reward_events WHERE source_event_id = $1 FOR UPDATE`, [eventId])).rows[0];
      if (!ev) return { status: "duplicate" };
      if (ev.verification_status === "detected" && fin && (coin || ev.operator_coin_id)) {
        if (BigInt(ev.reward_amount_base_units) !== r.amount || ev.raw_event_hash_or_reference !== hashTx(fin)) {
          await c.query(`UPDATE creator_reward_events SET verification_status = 'rejected', rejection_reason = 'changed_at_finalization' WHERE id = $1`, [ev.id]);
          await audit(c, { action: "community.event_rejected", target: signature, details: { eventId, reason: "changed_at_finalization" } });
          return { status: "rejected" };
        }
        await c.query(`UPDATE creator_reward_events SET verification_status = 'confirmed', operator_coin_id = COALESCE(operator_coin_id, $2), rejection_reason = NULL, received_slot = $3 WHERE id = $1`, [ev.id, coin ? coin.id : null, fin.slot]);
        await audit(c, { actorWallet: actor, action: "community.event_confirmed", target: signature, details: { eventId } });
        ev.verification_status = "confirmed";
      }
      if (ev.verification_status !== "confirmed") return { status: ev.verification_status, reason: ev.rejection_reason };
      return { status: "confirmed", allocation: await allocate(c, ev) };
    });
    if (out.reject) results.push(await reject(eventId, signature, r.asset, tx, out.reject, r.amount));
    else results.push({ eventId, ...out });
  }
  return { signature, results };
}

// Exactly one allocation + one accrued ledger row per confirmed event (UNIQUE constraints back this up).
async function allocate(c, ev) {
  const { community, operator } = split(ev.reward_amount_base_units, F().communityBps);
  const a = (await c.query(
    `INSERT INTO creator_reward_allocations (creator_reward_event_id, community_fund_bps, operator_retained_bps, community_fund_amount_base_units, operator_retained_amount_base_units, asset_mint, operator_creator_reward_wallet, community_treasury_wallet)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (creator_reward_event_id) DO NOTHING RETURNING id`,
    [ev.id, F().communityBps, F().operatorBps, community.toString(), operator.toString(), ev.asset_mint, ev.reward_recipient_wallet, F().treasuryWallet])).rows[0];
  if (!a) return { created: false };
  await c.query(`INSERT INTO community_fund_ledger (source_allocation_id, asset_mint, allocated_amount_base_units, treasury_wallet) VALUES ($1,$2,$3,$4) ON CONFLICT (source_allocation_id) DO NOTHING`,
    [a.id, ev.asset_mint, community.toString(), F().treasuryWallet]);
  await audit(c, { action: "community.allocation_calculated", target: String(a.id), details: { event: ev.id, amount: String(ev.reward_amount_base_units), community: community.toString(), operator: operator.toString(), bps: F().communityBps } });
  return { created: true, id: a.id, community: community.toString(), operator: operator.toString() };
}

// Admin: attach an approved operator coin to an event that couldn't be matched automatically.
async function matchEvent(eventId, operatorCoinId, actor) {
  const ev = (await db.query(`SELECT * FROM creator_reward_events WHERE id = $1`, [eventId])).rows[0];
  if (!ev) return { ok: false, code: "not_found" };
  if (ev.verification_status !== "detected") return { ok: false, code: "bad_status" };
  const out = await processSignature(ev.source_transaction_signature, { operatorCoinId, actor });
  return { ok: true, out };
}

async function reverseEvent(eventId, reason, actor) {
  return db.tx(async (c) => {
    const ev = (await c.query(`SELECT * FROM creator_reward_events WHERE id = $1 FOR UPDATE`, [eventId])).rows[0];
    if (!ev) return { ok: false, code: "not_found" };
    const al = (await c.query(`SELECT * FROM creator_reward_allocations WHERE creator_reward_event_id = $1 FOR UPDATE`, [ev.id])).rows[0];
    if (al && ["transferred", "verified"].includes(al.allocation_status)) return { ok: false, code: "already_transferred" };
    await c.query(`UPDATE creator_reward_events SET verification_status = 'reversed', rejection_reason = $2 WHERE id = $1`, [ev.id, String(reason).slice(0, 200)]);
    if (al) {
      await c.query(`UPDATE creator_reward_allocations SET allocation_status = 'reversed', error_message = $2 WHERE id = $1`, [al.id, String(reason).slice(0, 200)]);
      await c.query(`UPDATE community_fund_ledger SET status = 'reversed' WHERE source_allocation_id = $1`, [al.id]);
    }
    await audit(c, { actorWallet: actor, action: "community.event_reversed", target: String(ev.id), details: { reason, allocation: al && al.id } });
    return { ok: true };
  });
}

// Record a transfer proposal. A human sends it from the operator wallet through their own wallet / multisig.
async function proposeTransfer(allocationId, actor) {
  return db.tx(async (c) => {
    const al = (await c.query(`SELECT * FROM creator_reward_allocations WHERE id = $1 FOR UPDATE`, [allocationId])).rows[0];
    if (!al) return { ok: false, code: "not_found" };
    if (al.allocation_status !== "calculated") return { ok: false, code: "bad_status", status: al.allocation_status };
    await c.query(`UPDATE creator_reward_allocations SET allocation_status = 'awaiting_multisig_transfer' WHERE id = $1`, [al.id]);
    await c.query(`UPDATE community_fund_ledger SET status = 'transfer_proposed' WHERE source_allocation_id = $1`, [al.id]);
    const proposal = { allocationId: al.id, asset: al.asset_mint, amountBaseUnits: String(al.community_fund_amount_base_units), from: al.operator_creator_reward_wallet, to: al.community_treasury_wallet, reason: `Community Fund share (${al.community_fund_bps} bps) of creator reward event ${al.creator_reward_event_id}` };
    await audit(c, { actorWallet: actor, action: "community.transfer_proposed", target: String(al.id), details: proposal });
    return { ok: true, proposal };
  });
}

// How much of `asset` moved from `from` to `to` in a parsed transaction.
function moved(tx, from, to, asset) {
  const keys = keysOf(tx);
  if (asset === NATIVE) {
    const ti = keys.indexOf(to), fi = keys.indexOf(from);
    if (ti < 0 || fi < 0) return 0n;
    const inTo = BigInt(tx.meta.postBalances[ti]) - BigInt(tx.meta.preBalances[ti]);
    const outFrom = BigInt(tx.meta.preBalances[fi]) - BigInt(tx.meta.postBalances[fi]);
    return inTo > 0n && outFrom > 0n ? (inTo < outFrom ? inTo : outFrom) : 0n;
  }
  const bal = (list, owner) => (list || []).filter((b) => b.owner === owner && b.mint === asset).reduce((s, b) => s + BigInt(b.uiTokenAmount.amount), 0n);
  const inTo = bal(tx.meta.postTokenBalances, to) - bal(tx.meta.preTokenBalances, to);
  const outFrom = bal(tx.meta.preTokenBalances, from) - bal(tx.meta.postTokenBalances, from);
  return inTo > 0n && outFrom > 0n ? (inTo < outFrom ? inTo : outFrom) : 0n;
}

// Independent on-chain check: succeeded, moved >= amount from -> to. Returns the commitment level reached.
async function verifyMovement(signature, from, to, asset, amount) {
  if (!SIG_RE.test(String(signature))) return { ok: false, code: "bad_signature", message: "Not a valid Solana signature." };
  if (!from || !to) return { ok: false, code: "not_configured", message: "Wallet addresses are not configured." };
  let fin, tx;
  try { fin = await fetchTx(signature, "finalized"); tx = fin || (await fetchTx(signature, "confirmed")); }
  catch { return { ok: false, code: "rpc_error", message: "Solana RPC error. Try again." }; }
  if (!tx) return { ok: false, code: "not_found", message: "That transaction wasn't found on Solana." };
  if (!wellFormed(tx)) return { ok: false, code: "malformed", message: "Unreadable transaction." };
  if (tx.meta.err) return { ok: false, code: "tx_failed", message: "That transaction failed on chain." };
  const got = moved(tx, from, to, asset);
  if (got < BigInt(amount)) return { ok: false, code: "amount_short", message: `Transfer moved ${got} base units; ${amount} required.` };
  return { ok: true, finalized: !!fin, slot: tx.slot };
}

// After a human sends the Community Fund share, confirm it on chain. 'transferred' = confirmed, 'verified' = finalized.
async function verifyTransfer(allocationId, signature, actor) {
  const al = (await db.query(`SELECT * FROM creator_reward_allocations WHERE id = $1`, [allocationId])).rows[0];
  if (!al) return { ok: false, code: "not_found", message: "Allocation not found." };
  if (al.allocation_status === "verified") return { ok: al.community_transfer_signature === signature, code: "already", message: "Already verified." };
  if (!["calculated", "awaiting_multisig_transfer", "transferred"].includes(al.allocation_status)) return { ok: false, code: "bad_status", message: `Allocation is ${al.allocation_status}.` };
  if (al.community_transfer_signature && al.community_transfer_signature !== signature) return { ok: false, code: "signature_mismatch", message: "A different transfer is already recorded for this allocation." };
  const used = (await db.query(`SELECT 1 FROM creator_reward_allocations WHERE community_transfer_signature = $1 AND id <> $2 UNION SELECT 1 FROM community_reward_grants WHERE payment_transaction_signature = $1`, [signature, al.id])).rowCount;
  if (used) return { ok: false, code: "signature_used", message: "That transaction is already recorded elsewhere." };
  const v = await verifyMovement(signature, al.operator_creator_reward_wallet, al.community_treasury_wallet, al.asset_mint, al.community_fund_amount_base_units);
  if (!v.ok) { await audit(null, { actorWallet: actor, action: "community.transfer_check_failed", target: String(al.id), details: { signature, code: v.code } }); return v; }
  const status = v.finalized ? "verified" : "transferred";
  await db.tx(async (c) => {
    await c.query(`UPDATE creator_reward_allocations SET allocation_status = $2, community_transfer_signature = $3, transfer_verified_at = CASE WHEN $2 = 'verified' THEN now() ELSE NULL END WHERE id = $1`, [al.id, status, signature]);
    await c.query(`UPDATE community_fund_ledger SET status = $2, transaction_signature = $3, transfer_verified = $4, verification_slot = $5 WHERE source_allocation_id = $1`, [al.id, status, signature, v.finalized, v.slot]);
    await audit(c, { actorWallet: actor, action: `community.transfer_${status}`, target: String(al.id), details: { signature, slot: v.slot } });
  });
  return { ok: true, status };
}

// Scan recent operator-wallet transactions; re-check events and transfers still waiting for finalization.
let running = false;
async function tick() {
  if (running || !CFG || !F().accounting) return;
  running = true;
  try {
    let sigs = [];
    try { sigs = (await sol.rpc("getSignaturesForAddress", [F().operatorWallet, { limit: 100, commitment: "confirmed" }])) || []; }
    catch (e) { console.error("[creator-rewards] rpc", String(e.message).slice(0, 120)); }
    for (const s of sigs) {
      if (s.err) continue;
      const known = (await db.query(`SELECT 1 FROM creator_reward_events WHERE source_transaction_signature = $1 AND verification_status <> 'detected' LIMIT 1`, [s.signature])).rowCount;
      if (!known) await processSignature(s.signature).catch((e) => console.error("[creator-rewards]", String(e.message).slice(0, 120)));
    }
    const waiting = (await db.query(`SELECT DISTINCT source_transaction_signature AS s FROM creator_reward_events WHERE verification_status = 'detected' AND operator_coin_id IS NOT NULL LIMIT 100`)).rows;
    for (const w of waiting) await processSignature(w.s).catch(() => {});
    const transfers = (await db.query(`SELECT id, community_transfer_signature AS s FROM creator_reward_allocations WHERE allocation_status = 'transferred' LIMIT 100`)).rows;
    for (const t of transfers) await verifyTransfer(t.id, t.s, null).catch(() => {});
  } finally { running = false; }
}

// ---------------------------------------------------------------- reward programs + grants (records only)
const PROGRAM_FLOW = { draft: ["proposed", "cancelled"], proposed: ["approved", "cancelled"], approved: ["active", "cancelled"], active: ["paused", "completed"], paused: ["active", "completed", "cancelled"], completed: [], cancelled: [] };
async function setProgramStatus(id, status, actor) {
  const p = (await db.query(`SELECT * FROM community_reward_programs WHERE id = $1`, [id])).rows[0];
  if (!p) return { ok: false, code: "not_found", message: "Program not found." };
  if (!(PROGRAM_FLOW[p.status] || []).includes(status)) return { ok: false, code: "bad_transition", message: `Can't go from ${p.status} to ${status}.` };
  if (status === "active" && !F().enabled) return { ok: false, code: "fund_disabled", message: "Programs can't be activated while COMMUNITY_FUND_ENABLED=false." };
  await db.query(`UPDATE community_reward_programs SET status = $2 WHERE id = $1`, [id, status]);
  await audit(null, { actorWallet: actor, action: "community.program_status", target: String(id), details: { from: p.status, to: status } });
  return { ok: true };
}
async function createGrant({ programId, recipient, amount, proof }, actor) {
  if (!F().enabled) return { ok: false, code: "fund_disabled", message: "The Community Fund is disabled." };
  return db.tx(async (c) => {
    const p = (await c.query(`SELECT * FROM community_reward_programs WHERE id = $1 FOR UPDATE`, [programId])).rows[0];
    if (!p || p.status !== "active") return { ok: false, code: "no_program", message: "Grants need an approved, active program." };
    const now = new Date();
    if (now < new Date(p.starts_at) || now > new Date(p.ends_at)) return { ok: false, code: "outside_dates", message: "The program isn't running right now." };
    const used = BigInt((await c.query(`SELECT COALESCE(SUM(award_amount_base_units),0)::text AS n FROM community_reward_grants WHERE program_id = $1 AND status NOT IN ('rejected','reversed')`, [programId])).rows[0].n);
    if (used + BigInt(amount) > BigInt(p.budget_base_units)) return { ok: false, code: "over_budget", message: "That would exceed the program budget." };
    const g = (await c.query(`INSERT INTO community_reward_grants (program_id, recipient_wallet, award_amount_base_units, asset_mint, eligibility_proof_reference) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING RETURNING id`,
      [programId, recipient, String(amount), p.asset_mint, proof])).rows[0];
    if (!g) return { ok: false, code: "duplicate", message: "That grant already exists." };
    await audit(c, { actorWallet: actor, action: "community.grant_created", target: String(g.id), details: { programId, recipient, amount: String(amount), proof } });
    return { ok: true, id: g.id };
  });
}
const GRANT_FLOW = { pending: ["approved", "rejected"], approved: ["payment_proposed", "rejected"], payment_proposed: ["rejected"], paid: ["reversed"], rejected: [], reversed: [] };
async function setGrantStatus(id, status, actor) {
  const g = (await db.query(`SELECT * FROM community_reward_grants WHERE id = $1`, [id])).rows[0];
  if (!g) return { ok: false, code: "not_found", message: "Grant not found." };
  if (!(GRANT_FLOW[g.status] || []).includes(status)) return { ok: false, code: "bad_transition", message: `Can't go from ${g.status} to ${status}.` };
  if (["approved", "payment_proposed"].includes(status) && !F().enabled) return { ok: false, code: "fund_disabled", message: "The Community Fund is disabled." };
  await db.query(`UPDATE community_reward_grants SET status = $2, decided_by = $3 WHERE id = $1`, [id, status, actor]);
  await audit(null, { actorWallet: actor, action: "community.grant_status", target: String(id), details: { from: g.status, to: status } });
  return { ok: true };
}
// Mark a grant paid only after its multisig payment is verified on chain (finalized) from the treasury to the recipient.
async function verifyGrantPayment(id, signature, actor) {
  if (!F().enabled) return { ok: false, code: "fund_disabled", message: "The Community Fund is disabled." };
  const g = (await db.query(`SELECT * FROM community_reward_grants WHERE id = $1`, [id])).rows[0];
  if (!g) return { ok: false, code: "not_found", message: "Grant not found." };
  if (g.status !== "payment_proposed") return { ok: false, code: "bad_status", message: `Grant is ${g.status}.` };
  const used = (await db.query(`SELECT 1 FROM community_reward_grants WHERE payment_transaction_signature = $1 UNION SELECT 1 FROM creator_reward_allocations WHERE community_transfer_signature = $1`, [signature])).rowCount;
  if (used) return { ok: false, code: "signature_used", message: "That transaction is already recorded." };
  const v = await verifyMovement(signature, F().treasuryWallet, g.recipient_wallet, g.asset_mint, g.award_amount_base_units);
  if (!v.ok) return v;
  if (!v.finalized) return { ok: false, code: "not_finalized", message: "Wait until the payment is finalized, then verify again." };
  await db.query(`UPDATE community_reward_grants SET status = 'paid', payment_transaction_signature = $2, payment_verified_at = now(), decided_by = $3 WHERE id = $1`, [id, signature, actor]);
  await audit(null, { actorWallet: actor, action: "community.grant_paid", target: String(id), details: { signature, slot: v.slot } });
  return { ok: true };
}

// ---------------------------------------------------------------- public summary
async function policies() {
  const rows = (await db.query(`SELECT DISTINCT ON (key) key, version, body FROM policy_versions ORDER BY key, created_at DESC`)).rows;
  return Object.fromEntries(rows.map((r) => [r.key, { version: r.version, text: r.body }]));
}
const DISCLOSURE = "TEK CITY allocates 20% of verified creator rewards it actually receives from eligible TEK CITY-operated coins to the Community Fund. Community Fund assets may support announced game and community programs. Token ownership does not provide equity, dividends, revenue share, profit rights, ownership of Community Fund assets, or guaranteed financial returns.";

async function publicSummary({ full = false } = {}) {
  const f = F();
  const status = !f.enabled ? "not_active" : f.paused ? "paused" : "active";
  const pol = await policies().catch(() => ({}));
  const base = { status, enabled: f.enabled, disclosure: (pol.community_fund_disclosure && pol.community_fund_disclosure.text) || DISCLOSURE, policies: pol, bps: { community: f.communityBps, operator: f.operatorBps }, policyUrl: f.policyUrl || null, network: NET() };
  if (!full) return base;
  const sumBy = async (sql) => (await db.query(sql)).rows.map((r) => ({ asset: r.asset, baseUnits: r.n }));
  const [verified, accrued, transferred, atTreasury, committed, paid] = await Promise.all([
    sumBy(`SELECT asset_mint AS asset, SUM(reward_amount_base_units)::text AS n FROM creator_reward_events WHERE verification_status = 'confirmed' GROUP BY asset_mint`),
    sumBy(`SELECT asset_mint AS asset, SUM(allocated_amount_base_units)::text AS n FROM community_fund_ledger WHERE status IN ('accrued','transfer_proposed') GROUP BY asset_mint`),
    sumBy(`SELECT asset_mint AS asset, SUM(allocated_amount_base_units)::text AS n FROM community_fund_ledger WHERE status = 'transferred' GROUP BY asset_mint`),
    sumBy(`SELECT asset_mint AS asset, SUM(allocated_amount_base_units)::text AS n FROM community_fund_ledger WHERE status = 'verified' AND transfer_verified GROUP BY asset_mint`),
    sumBy(`SELECT asset_mint AS asset, SUM(award_amount_base_units)::text AS n FROM community_reward_grants WHERE status IN ('approved','payment_proposed') GROUP BY asset_mint`),
    sumBy(`SELECT asset_mint AS asset, SUM(award_amount_base_units)::text AS n FROM community_reward_grants WHERE status = 'paid' GROUP BY asset_mint`),
  ]);
  const get = (list, a) => BigInt((list.find((x) => x.asset === a) || { baseUnits: "0" }).baseUnits);
  const assets = [...new Set([...atTreasury, ...committed, ...paid].map((x) => x.asset))];
  const available = assets.map((a) => { const v = get(atTreasury, a) - get(paid, a) - get(committed, a); return { asset: a, baseUnits: (v > 0n ? v : 0n).toString() }; });
  const programs = (await db.query(`SELECT id, name, description, purpose, eligibility_rules, asset_mint, budget_base_units::text AS budget, status, starts_at, ends_at, policy_version FROM community_reward_programs WHERE status IN ('active','paused','completed') ORDER BY starts_at DESC LIMIT 50`)).rows;
  const transfers = (await db.query(`SELECT l.asset_mint AS asset, l.allocated_amount_base_units::text AS amount, l.transaction_signature AS signature, l.verification_slot AS slot, l.updated_at AS at FROM community_fund_ledger l WHERE l.status = 'verified' AND l.transfer_verified ORDER BY l.updated_at DESC LIMIT 25`)).rows;
  const payouts = (await db.query(`SELECT g.asset_mint AS asset, g.award_amount_base_units::text AS amount, g.payment_transaction_signature AS signature, g.payment_verified_at AS at, p.name AS program FROM community_reward_grants g JOIN community_reward_programs p ON p.id = g.program_id WHERE g.status = 'paid' ORDER BY g.payment_verified_at DESC LIMIT 25`)).rows;
  return {
    ...base, operatorWallet: f.operatorWallet || null, treasuryWallet: f.treasuryWallet || null,
    totals: { creatorRewardsVerified: verified, fundAccrued: accrued, fundTransferred: transferred, fundVerifiedAtTreasury: atTreasury, rewardsCommitted: committed, rewardsPaid: paid, rewardsAvailable: available },
    programs, transfers, payouts,
  };
}

module.exports = {
  configure, split, processSignature, allocate, matchEvent, reverseEvent, proposeTransfer, verifyTransfer, verifyMovement,
  setProgramStatus, createGrant, setGrantStatus, verifyGrantPayment, tick, publicSummary, policies, DISCLOSURE, REWARD_PROGRAMS,
};
