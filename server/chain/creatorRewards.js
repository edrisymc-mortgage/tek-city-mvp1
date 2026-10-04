"use strict";
// Creator-reward Community Fund accounting.
//
// What this does
//   1. Reads finalized transactions for OPERATOR_CREATOR_REWARD_WALLET (TEK CITY's own creator wallet) via SOLANA_RPC_URL.
//   2. Treats a transaction as a creator reward only when it invoked a Pump.fun program and the operator wallet's
//      balance of an asset went up. One immutable creator_reward_event per (transaction, asset).
//   3. Only after the event is finalized and validated: one allocation (20% Community Fund / 80% operator, integer
//      base units) and one pending community_fund_ledger row ("allocated, not yet transferred").
//   4. Verifies, on request, that an external-multisig transfer to COMMUNITY_TREASURY_WALLET happened on chain, then
//      marks the allocation transferred and the ledger row confirmed.
//
// What this never does
//   - Sign or send anything. The server has no key for any TEK CITY wallet. Moving money is done by the multisig.
//   - Look at players' coins, launches, buys, trading volume or token prices. Creator rewards on a player's coin belong
//     to that player's wallet.
//
// Rounding: community = floor(amount * communityBps / 10000); operator = amount - community.
// The remainder of the integer division therefore stays with the operator ledger.
const db = require("../db/pool");
const sol = require("./solana");

// Programs whose payouts count as creator rewards (Pump.fun bonding curve, PumpSwap AMM, Pump fee program).
const REWARD_PROGRAMS = new Set([
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
  "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ",
]);
const NATIVE = "SOL";
const WSOL = "So11111111111111111111111111111111111111112";

let CFG = null;
function configure(config) { CFG = config; }
const F = () => CFG.communityFund;

function split(amount, communityBps) {
  const a = BigInt(amount), bps = BigInt(communityBps);
  if (a <= 0n) throw new Error("amount must be positive");
  if (bps < 0n || bps > 10000n) throw new Error("bad bps");
  const community = (a * bps) / 10000n; // floor
  return { community, operator: a - community };
}

const keyOf = (k) => (typeof k === "string" ? k : k && (k.pubkey && (k.pubkey.toBase58 ? k.pubkey.toBase58() : k.pubkey)));
function programsIn(tx) {
  const ids = new Set();
  const m = tx.transaction && tx.transaction.message;
  const keys = ((m && m.accountKeys) || []).map(keyOf);
  const add = (ix) => { const id = ix.programId || (ix.programIdIndex != null ? keys[ix.programIdIndex] : null); if (id) ids.add(String(id)); };
  for (const ix of (m && m.instructions) || []) add(ix);
  for (const inner of (tx.meta && tx.meta.innerInstructions) || []) for (const ix of inner.instructions || []) add(ix);
  return ids;
}

// Net increase in each asset the wallet received in this transaction. Native SOL adds back the fee the wallet paid,
// so a creator claiming its own rewards isn't undercounted.
function receipts(tx, wallet) {
  const out = [];
  const keys = ((tx.transaction && tx.transaction.message && tx.transaction.message.accountKeys) || []).map(keyOf);
  const i = keys.indexOf(wallet);
  if (i >= 0 && tx.meta) {
    let d = BigInt(tx.meta.postBalances[i]) - BigInt(tx.meta.preBalances[i]);
    if (i === 0) d += BigInt(tx.meta.fee || 0);
    if (d > 0n) out.push({ asset: NATIVE, amount: d });
  }
  const sum = (list) => { const m = new Map(); for (const b of list || []) if (b.owner === wallet) m.set(b.mint, (m.get(b.mint) || 0n) + BigInt(b.uiTokenAmount.amount)); return m; };
  const pre = sum(tx.meta && tx.meta.preTokenBalances), post = sum(tx.meta && tx.meta.postTokenBalances);
  for (const [mint, v] of post) { const d = v - (pre.get(mint) || 0n); if (d > 0n) out.push({ asset: mint, amount: d }); }
  return out;
}
function coinMintOf(tx) {
  const mints = new Set([...(tx.meta && tx.meta.preTokenBalances) || [], ...(tx.meta && tx.meta.postTokenBalances) || []].map((b) => b.mint).filter((m) => m !== WSOL));
  return mints.size === 1 ? [...mints][0] : null;
}

async function fetchTx(signature, commitment) {
  return sol.rpc("getTransaction", [signature, { encoding: "jsonParsed", commitment, maxSupportedTransactionVersion: 0 }]);
}

// Process one operator-wallet signature. Safe to call any number of times for the same signature.
async function processSignature(signature) {
  const op = F().operatorWallet;
  if (!F().accounting || !op) return { skipped: "not_configured" };
  const fin = await fetchTx(signature, "finalized");
  const tx = fin || (await fetchTx(signature, "confirmed"));
  if (!tx) return { skipped: "not_found" };
  if (![...programsIn(tx)].some((p) => REWARD_PROGRAMS.has(p))) return { skipped: "not_a_creator_reward" };
  const failed = !!(tx.meta && tx.meta.err);
  const got = failed ? [{ asset: NATIVE, amount: null }] : receipts(tx, op);
  if (!got.length) return { skipped: "no_receipt" };
  const results = [];
  for (const r of got) {
    const eventId = `${signature}:${r.asset}`;
    const status = failed ? "rejected" : fin ? "confirmed" : "detected";
    const reason = failed ? "transaction_failed" : null;
    if (failed) {
      // Record the rejection once, for the audit trail. It never gets an allocation.
      await db.query(
        `INSERT INTO creator_reward_events (source_type, source_event_id, source_transaction_signature, launch_id_or_coin_mint, reward_recipient_wallet, asset_mint, reward_amount_base_units, received_slot, received_at, verification_status, rejection_reason)
         VALUES ('onchain_transfer',$1,$2,$3,$4,$5,0,$6,to_timestamp($7),'rejected',$8) ON CONFLICT (source_event_id) DO NOTHING`,
        [eventId, signature, coinMintOf(tx), op, r.asset, tx.slot, tx.blockTime || 0, reason]);
      results.push({ eventId, status: "rejected" });
      continue;
    }
    const out = await db.tx(async (c) => {
      await c.query(
        `INSERT INTO creator_reward_events (source_type, source_event_id, source_transaction_signature, launch_id_or_coin_mint, reward_recipient_wallet, asset_mint, reward_amount_base_units, received_slot, received_at, verification_status)
         VALUES ('onchain_transfer',$1,$2,$3,$4,$5,$6,$7,to_timestamp($8),$9) ON CONFLICT (source_event_id) DO NOTHING`,
        [eventId, signature, coinMintOf(tx), op, r.asset, r.amount.toString(), tx.slot, tx.blockTime || 0, status]);
      const ev = (await c.query(`SELECT * FROM creator_reward_events WHERE source_event_id = $1 FOR UPDATE`, [eventId])).rows[0];
      if (ev.verification_status === "detected" && fin) {
        if (BigInt(ev.reward_amount_base_units) !== r.amount) {
          await c.query(`UPDATE creator_reward_events SET verification_status = 'rejected', rejection_reason = 'amount_changed_at_finalization' WHERE id = $1`, [ev.id]);
          return { eventId, status: "rejected" };
        }
        await c.query(`UPDATE creator_reward_events SET verification_status = 'confirmed', received_slot = $2 WHERE id = $1`, [ev.id, tx.slot]);
        ev.verification_status = "confirmed";
      }
      if (ev.verification_status !== "confirmed") return { eventId, status: ev.verification_status };
      return { eventId, status: "confirmed", allocation: await allocate(c, ev) };
    });
    results.push(out);
  }
  return { signature, results };
}

// Exactly one allocation + one pending ledger row per confirmed event (UNIQUE constraints back this up).
async function allocate(c, ev) {
  const { community, operator } = split(ev.reward_amount_base_units, F().communityBps);
  const a = (await c.query(
    `INSERT INTO creator_reward_allocations (creator_reward_event_id, community_fund_bps, operator_retained_bps, community_fund_amount_base_units, operator_retained_amount_base_units, asset_mint, operator_creator_reward_wallet, community_treasury_wallet)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (creator_reward_event_id) DO NOTHING RETURNING id`,
    [ev.id, F().communityBps, F().operatorBps, community.toString(), operator.toString(), ev.asset_mint, ev.reward_recipient_wallet, F().treasuryWallet || null])).rows[0];
  if (!a) return { created: false };
  await c.query(`INSERT INTO community_fund_ledger (source_allocation_id, asset_mint, allocated_amount_base_units, treasury_wallet) VALUES ($1,$2,$3,$4) ON CONFLICT (source_allocation_id) DO NOTHING`,
    [a.id, ev.asset_mint, community.toString(), F().treasuryWallet || null]);
  return { created: true, id: a.id, community: community.toString(), operator: operator.toString() };
}

// Mark a reward reversed (e.g. a finalized receipt later found to be ineligible). Never after a verified transfer.
async function reverseEvent(eventId, reason) {
  return db.tx(async (c) => {
    const ev = (await c.query(`SELECT * FROM creator_reward_events WHERE id = $1 FOR UPDATE`, [eventId])).rows[0];
    if (!ev) return { ok: false, code: "not_found" };
    const al = (await c.query(`SELECT * FROM creator_reward_allocations WHERE creator_reward_event_id = $1 FOR UPDATE`, [ev.id])).rows[0];
    if (al && al.status === "transferred") return { ok: false, code: "already_transferred" };
    await c.query(`UPDATE creator_reward_events SET verification_status = 'reversed', rejection_reason = $2 WHERE id = $1`, [ev.id, String(reason).slice(0, 200)]);
    if (al) {
      await c.query(`UPDATE creator_reward_allocations SET status = 'reversed', error_message = $2 WHERE id = $1`, [al.id, String(reason).slice(0, 200)]);
      await c.query(`UPDATE community_fund_ledger SET status = 'reversed' WHERE source_allocation_id = $1`, [al.id]);
    }
    return { ok: true };
  });
}

async function approveAllocation(id) {
  const r = await db.query(`UPDATE creator_reward_allocations SET status = 'approved' WHERE id = $1 AND status = 'calculated' RETURNING id`, [id]);
  return { ok: r.rowCount === 1 };
}

// How much of `asset` moved from `from` to `to` in a parsed transaction.
function moved(tx, from, to, asset) {
  const keys = ((tx.transaction && tx.transaction.message && tx.transaction.message.accountKeys) || []).map(keyOf);
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

// After the multisig sends the Community Fund share, confirm it on chain and close out the ledger row.
async function verifyTransfer(allocationId, signature) {
  const f = F();
  if (!f.treasuryWallet) return { ok: false, code: "no_treasury", message: "COMMUNITY_TREASURY_WALLET is not set." };
  const al = (await db.query(`SELECT * FROM creator_reward_allocations WHERE id = $1`, [allocationId])).rows[0];
  if (!al) return { ok: false, code: "not_found", message: "Allocation not found." };
  if (al.status === "transferred") return { ok: al.community_transfer_signature === signature, code: "already", message: "Already verified." };
  if (!["calculated", "approved"].includes(al.status)) return { ok: false, code: "bad_status", message: `Allocation is ${al.status}.` };
  const used = (await db.query(`SELECT 1 FROM creator_reward_allocations WHERE community_transfer_signature = $1 UNION SELECT 1 FROM community_fund_spends WHERE multisig_tx_signature = $1`, [signature])).rowCount;
  if (used) return { ok: false, code: "signature_used", message: "That transaction is already recorded." };
  const tx = await fetchTx(signature, "finalized");
  if (!tx) return { ok: false, code: "not_finalized", message: "That transaction isn't finalized on Solana (yet)." };
  if (tx.meta && tx.meta.err) return { ok: false, code: "tx_failed", message: "That transaction failed on chain." };
  const need = BigInt(al.community_fund_amount_base_units);
  const got = moved(tx, al.operator_creator_reward_wallet, f.treasuryWallet, al.asset_mint);
  if (got < need) return { ok: false, code: "amount_short", message: `Transfer moved ${got} base units to the treasury; ${need} required.` };
  await db.tx(async (c) => {
    await c.query(`UPDATE creator_reward_allocations SET status = 'transferred', community_transfer_signature = $2, community_treasury_wallet = $3 WHERE id = $1`, [al.id, signature, f.treasuryWallet]);
    await c.query(`UPDATE community_fund_ledger SET status = 'confirmed', transfer_verified = true, transaction_signature = $2, verification_slot = $3, treasury_wallet = $4 WHERE source_allocation_id = $1`, [al.id, signature, tx.slot, f.treasuryWallet]);
  });
  return { ok: true };
}

// Generic on-chain check used for Community Fund spending: finalized, succeeded, moved >= amount from -> to.
async function verifyMovement(signature, from, to, asset, amount) {
  if (!from) return { ok: false, code: "no_treasury", message: "COMMUNITY_TREASURY_WALLET is not set." };
  const tx = await fetchTx(signature, "finalized");
  if (!tx) return { ok: false, code: "not_finalized", message: "That transaction isn't finalized on Solana (yet)." };
  if (tx.meta && tx.meta.err) return { ok: false, code: "tx_failed", message: "That transaction failed on chain." };
  const got = moved(tx, from, to, asset);
  if (got < BigInt(amount)) return { ok: false, code: "amount_short", message: `Transfer moved ${got} base units; ${amount} required.` };
  return { ok: true, slot: tx.slot };
}

// Scan recent operator-wallet transactions and re-check events still waiting for finalization.
let running = false;
async function tick() {
  if (running || !CFG || !F().accounting) return;
  running = true;
  try {
    const sigs = (await sol.rpc("getSignaturesForAddress", [F().operatorWallet, { limit: 100, commitment: "confirmed" }])) || [];
    for (const s of sigs) {
      const known = (await db.query(`SELECT 1 FROM creator_reward_events WHERE source_transaction_signature = $1 AND verification_status <> 'detected' LIMIT 1`, [s.signature])).rowCount;
      if (!known) await processSignature(s.signature).catch((e) => console.error("[creator-rewards]", s.signature.slice(0, 8), String(e.message).slice(0, 120)));
    }
    const waiting = (await db.query(`SELECT DISTINCT source_transaction_signature AS s FROM creator_reward_events WHERE verification_status = 'detected' LIMIT 100`)).rows;
    for (const w of waiting) await processSignature(w.s).catch(() => {});
  } finally { running = false; }
}

const DISCLOSURE = "TEK CITY allocates 20% of creator rewards it actually receives from eligible TEK CITY-operated coins to the Community Fund. Community Fund assets may support disclosed game and community programs. Token ownership does not provide equity, dividends, revenue share, profit rights, ownership of Community Fund assets, or guaranteed financial returns.";

async function publicSummary() {
  const f = F();
  if (!f.enabled) return { enabled: false, disclosure: DISCLOSURE };
  const rows = (await db.query(
    `SELECT asset_mint, status, COALESCE(SUM(allocated_amount_base_units),0)::text AS n FROM community_fund_ledger WHERE status IN ('pending','confirmed') GROUP BY asset_mint, status`)).rows;
  const programs = (await db.query(`SELECT id, name, category, description, eligibility_rules, payment_method, asset_mint, budget_base_units::text AS budget, starts_at, ends_at, policy_url FROM community_programs WHERE status = 'active' AND now() BETWEEN starts_at AND ends_at ORDER BY starts_at`)).rows;
  const by = (st) => rows.filter((r) => r.status === st).map((r) => ({ asset: r.asset_mint, baseUnits: r.n }));
  return {
    enabled: true, disclosure: DISCLOSURE, policyUrl: f.policyUrl || null, treasuryWallet: f.treasuryWallet || null, bps: f.communityBps,
    accruedNotTransferred: by("pending"), transferredVerified: by("confirmed"), programs,
  };
}

module.exports = { configure, split, processSignature, allocate, reverseEvent, approveAllocation, verifyTransfer, verifyMovement, tick, publicSummary, DISCLOSURE, REWARD_PROGRAMS };
