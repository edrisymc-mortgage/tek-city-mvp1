"use strict";
// One-tap Community Fund operations. The server BUILDS unsigned transactions; a human approves each one in the
// wallet that owns the funds (Phantom etc.). The server never holds a key.
//
//   claim   operator wallet claims its pump.fun creator rewards                      (signed by the operator wallet)
//   sweep   operator wallet sends the Community Fund share to the treasury           (signed by the operator wallet)
//           amount = sum of calculated allocations, each floor(reward * bps / 10000) with bps capped at 2000 (20%)
//   payout  treasury pays players what they earned in the game                       (signed by the treasury wallet)
//
// After signing, the browser returns the signed transaction. The server checks it is exactly what it built, sends it,
// waits for Solana to confirm it, and only then records anything. Finalization is re-checked by tick().
const { PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } = require("@solana/web3.js");
const db = require("../db/pool");
const sol = require("./solana");
const pump = require("./pump");
const cr = require("./creatorRewards");
const rewards = require("../game/rewards");
const { audit } = require("../audit");

let CFG = null;
function configure(config) { CFG = config; }
const F = () => CFG.communityFund;
const NATIVE = "SOL";
const OP_TTL_MS = 120e3;

const err = (code, message) => ({ ok: false, code, message });

async function buildTransfers(from, transfers) {
  const bh = await sol.rpc("getLatestBlockhash", [{ commitment: "confirmed" }]);
  const ixs = transfers.map((t) => SystemProgram.transfer({ fromPubkey: new PublicKey(from), toPubkey: new PublicKey(t.to), lamports: BigInt(t.lamports) }));
  const msg = new TransactionMessage({ payerKey: new PublicKey(from), recentBlockhash: bh.value.blockhash, instructions: ixs }).compileToV0Message();
  return Buffer.from(new VersionedTransaction(msg).serialize()).toString("base64");
}

async function expireStale() {
  const stale = (await db.query(`UPDATE fund_ops SET status = 'expired', updated_at = now() WHERE status = 'built' AND created_at < now() - ($1 || ' milliseconds')::interval RETURNING *`, [String(OP_TTL_MS)])).rows;
  for (const op of stale) await release(op, "expired");
}
// Undo the reservations of an op that never landed on chain.
async function release(op, why) {
  if (op.kind === "sweep" && op.allocation_ids.length) {
    await db.query(`UPDATE creator_reward_allocations SET allocation_status = 'calculated' WHERE id = ANY($1) AND allocation_status = 'awaiting_multisig_transfer'`, [op.allocation_ids]);
    await db.query(`UPDATE community_fund_ledger SET status = 'accrued' WHERE source_allocation_id = ANY($1) AND status = 'transfer_proposed'`, [op.allocation_ids]);
  }
  if (op.kind === "payout" && op.grant_ids.length) {
    await db.query(`UPDATE community_reward_grants SET status = 'rejected', decided_by = $2 WHERE id = ANY($1) AND status = 'payment_proposed'`, [op.grant_ids, `system:${why}`]);
    await db.query(`UPDATE player_earnings SET grant_id = NULL WHERE grant_id = ANY($1)`, [op.grant_ids]);
    if (op.program_id) await db.query(`UPDATE community_reward_programs SET status = 'cancelled' WHERE id = $1 AND status = 'active'`, [op.program_id]);
  }
  await audit(null, { action: `community.op_${why}`, target: String(op.id), details: { kind: op.kind } });
}
async function openOp(kind) {
  await expireStale();
  return (await db.query(`SELECT id FROM fund_ops WHERE kind = $1 AND status IN ('built','sent') LIMIT 1`, [kind])).rows[0];
}

// ------------------------------------------------------------------ claim
async function buildClaim(actor) {
  if (!F().accounting) return err("not_configured", "Set OPERATOR_CREATOR_REWARD_WALLET and COMMUNITY_TREASURY_WALLET first.");
  if (actor !== F().operatorWallet) return err("wrong_wallet", "Sign in with the operator creator-reward wallet to claim.");
  if (await openOp("claim")) return err("busy", "A claim is already waiting for approval. Approve it or wait 2 minutes.");
  const coin = (await db.query(`SELECT * FROM operator_coins WHERE eligibility_status = 'active' AND network = $1 AND operator_reward_wallet = $2 ORDER BY id LIMIT 1`, [CFG.solana.network, F().operatorWallet])).rows[0];
  if (!coin) return err("no_coin", "No active TEK CITY coin is recorded yet. Set OFFICIAL_TOKEN_MINT after launch.");
  let built;
  try { built = await pump.collectFees({ payer: F().operatorWallet, mint: coin.mint_address_or_launch_id }); }
  catch (e) { return err("pump_error", e.message || "pump.fun couldn't build the claim."); }
  const rv = sol.review(built.transaction);
  if (rv.payer !== F().operatorWallet) return err("pump_error", "pump.fun built the claim for the wrong wallet. Nothing was sent.");
  if (rv.transfers.some((t) => t.from === F().operatorWallet)) return err("pump_error", "That claim would send SOL out of the operator wallet, so it was refused.");
  const op = (await db.query(`INSERT INTO fund_ops (kind, wallet, tx_b64, actor, operator_coin_id) VALUES ('claim',$1,$2,$3,$4) RETURNING id`, [F().operatorWallet, built.transaction, actor, coin.id])).rows[0];
  await audit(null, { actorWallet: actor, action: "community.claim_built", target: String(op.id), details: { coin: coin.id } });
  return { ok: true, opId: op.id, kind: "claim", wallet: F().operatorWallet, transaction: built.transaction, summary: `Claim pump.fun creator rewards for $${coin.token_symbol} into the operator wallet.` };
}

// ------------------------------------------------------------------ sweep (max 20%)
async function buildSweep(actor) {
  if (!F().accounting) return err("not_configured", "Set OPERATOR_CREATOR_REWARD_WALLET and COMMUNITY_TREASURY_WALLET first.");
  if (actor !== F().operatorWallet) return err("wrong_wallet", "Sign in with the operator creator-reward wallet to move the fund share.");
  if (F().communityBps > 2000) return err("over_cap", "The Community Fund share can't be more than 20%.");
  if (await openOp("sweep")) return err("busy", "A transfer is already waiting for approval. Approve it or wait 2 minutes.");
  return db.tx(async (c) => {
    const rows = (await c.query(`SELECT id, community_fund_amount_base_units::text AS amt, community_fund_bps FROM creator_reward_allocations
       WHERE allocation_status = 'calculated' AND asset_mint = $1 AND community_treasury_wallet = $2 AND operator_creator_reward_wallet = $3 ORDER BY id LIMIT 200 FOR UPDATE`,
      [NATIVE, F().treasuryWallet, F().operatorWallet])).rows.filter((r) => r.community_fund_bps <= 2000);
    const total = rows.reduce((s, r) => s + BigInt(r.amt), 0n);
    if (!rows.length || total <= 0n) return err("nothing", "No new Community Fund share to move. Claim creator rewards first, then wait for Solana to finalize them (about a minute).");
    const bal = BigInt(await sol.solBalance(F().operatorWallet));
    if (bal < total + 10_000n) return err("insufficient_sol", "The operator wallet doesn't hold enough SOL for this transfer.");
    const tx = await buildTransfers(F().operatorWallet, [{ to: F().treasuryWallet, lamports: total }]);
    const ids = rows.map((r) => Number(r.id));
    await c.query(`UPDATE creator_reward_allocations SET allocation_status = 'awaiting_multisig_transfer' WHERE id = ANY($1)`, [ids]);
    await c.query(`UPDATE community_fund_ledger SET status = 'transfer_proposed' WHERE source_allocation_id = ANY($1)`, [ids]);
    const op = (await c.query(`INSERT INTO fund_ops (kind, wallet, amount_lamports, allocation_ids, tx_b64, actor) VALUES ('sweep',$1,$2,$3,$4,$5) RETURNING id`,
      [F().operatorWallet, total.toString(), ids, tx, actor])).rows[0];
    await audit(c, { actorWallet: actor, action: "community.sweep_built", target: String(op.id), details: { lamports: total.toString(), allocations: ids.length } });
    return { ok: true, opId: op.id, kind: "sweep", wallet: F().operatorWallet, transaction: tx, lamports: total.toString(), summary: `Send ${sol9(total)} SOL (the Community Fund's ${F().communityBps / 100}% share) to the treasury.` };
  });
}

// ------------------------------------------------------------------ payouts
const sumOf = async (c, sql, args = []) => BigInt((await c.query(sql, args)).rows[0].n || 0);
async function available(c = db) {
  const atTreasury = await sumOf(c, `SELECT COALESCE(SUM(allocated_amount_base_units),0)::text AS n FROM community_fund_ledger WHERE asset_mint = 'SOL' AND status = 'verified' AND transfer_verified`);
  const out = await sumOf(c, `SELECT COALESCE(SUM(award_amount_base_units),0)::text AS n FROM community_reward_grants WHERE asset_mint = 'SOL' AND status IN ('approved','payment_proposed','paid')`);
  const ledger = atTreasury - out;
  let chain = 0n;
  try { chain = BigInt(await sol.solBalance(F().treasuryWallet)) - BigInt(F().payout.reserveLamports); } catch { chain = 0n; }
  const v = ledger < chain ? ledger : chain;
  return { ledger: ledger > 0n ? ledger : 0n, chain: chain > 0n ? chain : 0n, available: v > 0n ? v : 0n };
}

// Work out who gets what from this batch. Pure function (tested directly).
function plan({ budget, pending, split, minLamports, maxRecipients }) {
  const per = new Map(); // wallet -> { lamports, earningIds }
  const cats = ["leaderboard", "vault", "milestone"];
  for (const cat of cats) {
    const list = pending.filter((e) => e.category === cat);
    if (!list.length) continue;
    const share = (BigInt(budget) * BigInt(split[cat] || 0)) / 10000n;
    const totalW = list.reduce((s, e) => s + Math.round(Number(e.weight) * 10000), 0);
    if (share <= 0n || totalW <= 0) continue;
    for (const e of list) {
      const amt = (share * BigInt(Math.round(Number(e.weight) * 10000))) / BigInt(totalW);
      const cur = per.get(e.wallet) || { wallet: e.wallet, lamports: 0n, earningIds: [] };
      cur.lamports += amt; cur.earningIds.push(e.id); per.set(e.wallet, cur);
    }
  }
  return [...per.values()].filter((x) => x.lamports >= BigInt(minLamports)).sort((a, b) => (b.lamports > a.lamports ? 1 : b.lamports < a.lamports ? -1 : 0)).slice(0, maxRecipients);
}

async function buildPayout(actor) {
  if (!F().enabled) return err("fund_disabled", "Player payouts are off (COMMUNITY_FUND_ENABLED=false).");
  if (F().paused) return err("paused", "The Community Fund is paused.");
  if (actor !== F().treasuryWallet) return err("wrong_wallet", "Sign in with the Community Fund treasury wallet to approve payouts.");
  if (await openOp("payout")) return err("busy", "A payout is already waiting for approval. Approve it or wait 2 minutes.");
  await rewards.finalizeLeaderboards();
  return db.tx(async (c) => {
    await c.query(`SELECT pg_advisory_xact_lock(7105)`);
    const av = await available(c);
    const P = F().payout;
    const budget = (av.available * BigInt(P.batchBps)) / 10000n;
    if (budget <= 0n) return err("nothing", "The treasury has no verified Community Fund SOL available to pay out yet.");
    const pending = (await c.query(`SELECT e.id, e.wallet, e.category, e.weight FROM player_earnings e JOIN users u ON u.id = e.user_id
       WHERE e.grant_id IS NULL AND NOT u.is_banned AND e.wallet NOT IN ($1,$2) ORDER BY e.id LIMIT 5000`, [F().operatorWallet, F().treasuryWallet])).rows;
    const lines = plan({ budget, pending, split: P.split, minLamports: P.minLamports, maxRecipients: P.maxRecipients });
    if (!lines.length) return err("nothing", "No player has earned enough for a payout yet.");
    const total = lines.reduce((s, l) => s + l.lamports, 0n);
    const now = new Date(), end = new Date(now.getTime() + 24 * 3600e3);
    const pv = (await c.query(`SELECT version FROM policy_versions WHERE key = 'community_fund_disclosure' ORDER BY created_at DESC LIMIT 1`)).rows[0];
    const prog = (await c.query(`INSERT INTO community_reward_programs (name, description, purpose, eligibility_rules, fraud_controls, asset_mint, budget_base_units, status, starts_at, ends_at, policy_version, created_by)
       VALUES ($1,$2,'gameplay_contest',$3,$4,'SOL',$5,'active',$6,$7,$8,$9) RETURNING id`,
      [`Game rewards ${now.toISOString().slice(0, 16).replace("T", " ")} UTC`, "Automatic payout batch for players who earned rewards in TEK CITY: daily leaderboard, Vault jackpot and market-cap milestones.",
        `Daily top 3 by game points (weights 5/3/2), Vault jackpot hits (weight 1), and players active in the 24 hours before a market-cap milestone (weight 1). Split ${P.split.leaderboard / 100}% / ${P.split.vault / 100}% / ${P.split.milestone / 100}% of ${P.batchBps / 100}% of the available fund.`,
        "Wallet sign-in required, banned players excluded, one earning per event per player, TEK CITY wallets excluded, server-side calculation only, approval by the treasury wallet.",
        total.toString(), now, end, pv ? pv.version : "unversioned", actor])).rows[0];
    const grantIds = [];
    for (const l of lines) {
      const g = (await c.query(`INSERT INTO community_reward_grants (program_id, recipient_wallet, award_amount_base_units, asset_mint, eligibility_proof_reference, status, decided_by)
         VALUES ($1,$2,$3,'SOL',$4,'payment_proposed',$5) RETURNING id`, [prog.id, l.wallet, l.lamports.toString(), `earnings:${l.earningIds.join(",").slice(0, 380)}`, actor])).rows[0];
      grantIds.push(Number(g.id));
      await c.query(`UPDATE player_earnings SET grant_id = $1 WHERE id = ANY($2)`, [g.id, l.earningIds]);
    }
    const tx = await buildTransfers(F().treasuryWallet, lines.map((l) => ({ to: l.wallet, lamports: l.lamports })));
    const op = (await c.query(`INSERT INTO fund_ops (kind, wallet, amount_lamports, grant_ids, program_id, tx_b64, actor) VALUES ('payout',$1,$2,$3,$4,$5,$6) RETURNING id`,
      [F().treasuryWallet, total.toString(), grantIds, prog.id, tx, actor])).rows[0];
    await audit(c, { actorWallet: actor, action: "community.payout_built", target: String(op.id), details: { lamports: total.toString(), recipients: lines.length, program: prog.id } });
    return { ok: true, opId: op.id, kind: "payout", wallet: F().treasuryWallet, transaction: tx, lamports: total.toString(),
      recipients: lines.map((l) => ({ wallet: l.wallet, lamports: l.lamports.toString() })),
      summary: `Pay ${lines.length} player${lines.length === 1 ? "" : "s"} ${sol9(total)} SOL from the treasury.` };
  });
}

// ------------------------------------------------------------------ submit (all kinds)
async function submit(opId, signedB64, actor) {
  await expireStale();
  const op = (await db.query(`SELECT * FROM fund_ops WHERE id = $1`, [opId])).rows[0];
  if (!op) return err("not_found", "That request wasn't found.");
  if (op.status !== "built") return err("bad_status", op.status === "expired" ? "That request expired before it was signed. Nothing was sent. Start again." : `Already ${op.status}.`);
  if (actor !== op.wallet) return err("wrong_wallet", "Sign in with the wallet that has to approve this.");
  let signed;
  try { signed = sol.verifySigned(op.tx_b64, signedB64, op.wallet); } catch (e) { return err(e.code || "tx_modified", e.message); }
  const sig = sol.sigOf(signed);
  const claimed = (await db.query(`UPDATE fund_ops SET status = 'sent', signature = $2, updated_at = now() WHERE id = $1 AND status = 'built' RETURNING id`, [op.id, sig])).rows[0];
  if (!claimed) return err("busy", "Already being processed.");
  try { await sol.send(signedB64); }
  catch (e) {
    const st = await sol.sigStatus(sig).catch(() => ({ state: "unknown" }));
    if (st.state === "unknown" || st.state === "failed") {
      await db.query(`UPDATE fund_ops SET status = 'failed', error = $2, updated_at = now() WHERE id = $1`, [op.id, String(e.message).slice(0, 200)]);
      await release(op, "failed");
      return err("tx_failed", `Solana rejected it. Nothing moved. ${String(e.message).replace(/^Solana network error:?\s*/, "").slice(0, 140)}`);
    }
  }
  const st = await sol.waitFor(sig, 60e3);
  if (st.state === "failed") { await db.query(`UPDATE fund_ops SET status = 'failed', error = 'failed on chain', updated_at = now() WHERE id = $1`, [op.id]); await release(op, "failed"); return err("tx_failed", "The transaction failed on Solana. Nothing moved."); }
  if (st.state === "timeout") return { ok: true, pending: true, signature: sig, message: "Sent. Waiting for Solana to confirm. This page updates on its own." };
  await settleOp({ ...op, signature: sig }, st.state);
  return { ok: true, signature: sig, status: st.state };
}

// Record the confirmed effect of an op. Idempotent.
async function settleOp(op, state) {
  await db.query(`UPDATE fund_ops SET status = $2, updated_at = now() WHERE id = $1 AND status IN ('sent','confirmed')`, [op.id, state === "finalized" ? "finalized" : "confirmed"]);
  // A claim TEK CITY built for a specific active operator coin is a verified claim: match it to that coin.
  if (op.kind === "claim") { await cr.processSignature(op.signature, { operatorCoinId: op.operator_coin_id, actor: `op:${op.id}` }).catch(() => {}); return; }
  if (op.kind === "sweep") {
    // Each allocation is verified against the same transaction; the transfer must cover the batch total.
    for (const id of op.allocation_ids) await cr.verifyTransfer(id, op.signature, `op:${op.id}`).catch(() => {});
    return;
  }
  if (op.kind === "payout" && state === "finalized") {
    for (const id of op.grant_ids) await cr.verifyGrantPayment(id, op.signature, `op:${op.id}`).catch(() => {});
  }
}

async function tick() {
  if (!CFG || !F().accounting) return;
  await expireStale().catch(() => {});
  const ops = (await db.query(`SELECT * FROM fund_ops WHERE status IN ('sent','confirmed') AND signature IS NOT NULL ORDER BY id LIMIT 20`)).rows;
  for (const op of ops) {
    const st = await sol.sigStatus(op.signature).catch(() => ({ state: "unknown" }));
    if (st.state === "confirmed" || st.state === "finalized") await settleOp(op, st.state).catch(() => {});
    else if (st.state === "failed") { await db.query(`UPDATE fund_ops SET status = 'failed', error = 'failed on chain', updated_at = now() WHERE id = $1`, [op.id]); await release(op, "failed"); }
    else if (st.state === "unknown" && Date.now() - new Date(op.updated_at).getTime() > 5 * 60e3) {
      // Never landed (blockhash long expired).
      await db.query(`UPDATE fund_ops SET status = 'expired', error = 'not found on chain', updated_at = now() WHERE id = $1`, [op.id]); await release(op, "expired");
    }
  }
  await rewards.finalizeLeaderboards().catch(() => {});
}

// Register OFFICIAL_TOKEN_MINT as TEK CITY's own operator coin, so its creator rewards are tracked without a manual step.
async function ensureOfficialCoin() {
  const mint = CFG.spins && CFG.spins.mint;
  if (!mint || !F().accounting) return;
  const r = await db.query(`INSERT INTO operator_coins (mint_address_or_launch_id, token_name, token_symbol, launch_venue, network, operator_reward_wallet, eligibility_status, policy_version, configured_by_admin_id)
     VALUES ($1,'TEK CITY','TEKCITY','pump.fun',$2,$3,'active',COALESCE((SELECT version FROM policy_versions WHERE key = 'community_fund_model' ORDER BY created_at DESC LIMIT 1),'unversioned'),'env:OFFICIAL_TOKEN_MINT')
     ON CONFLICT (mint_address_or_launch_id) DO NOTHING RETURNING id`, [mint, CFG.solana.network, F().operatorWallet]);
  if (r.rowCount) await audit(null, { action: "community.official_coin_registered", target: mint, details: { id: r.rows[0].id } });
}

async function overview() {
  const pendingShare = await sumOf(db, `SELECT COALESCE(SUM(community_fund_amount_base_units),0)::text AS n FROM creator_reward_allocations WHERE allocation_status = 'calculated' AND asset_mint = 'SOL'`);
  const av = await available().catch(() => ({ ledger: 0n, chain: 0n, available: 0n }));
  const earnings = (await db.query(`SELECT category, count(*)::int AS n FROM player_earnings WHERE grant_id IS NULL GROUP BY category`)).rows;
  const ops = (await db.query(`SELECT id, kind, wallet, amount_lamports::text AS lamports, status, signature, error, created_at FROM fund_ops ORDER BY id DESC LIMIT 20`)).rows;
  const unclaimed = (await db.query(`SELECT count(*)::int AS n FROM creator_reward_events WHERE verification_status = 'detected'`)).rows[0].n;
  return { enabled: F().enabled, paused: F().paused, bps: F().communityBps, operatorWallet: F().operatorWallet, treasuryWallet: F().treasuryWallet, payout: { ...F().payout },
    fundShareWaitingLamports: pendingShare.toString(), treasury: { ledgerLamports: av.ledger.toString(), onChainSpendableLamports: av.chain.toString(), availableLamports: av.available.toString() },
    earningsPending: earnings, detectedAwaitingFinalization: unclaimed, ops };
}

const sol9 = (l) => (Number(l) / 1e9).toFixed(4).replace(/\.?0+$/, "");

module.exports = { configure, buildClaim, buildSweep, buildPayout, submit, tick, plan, available, overview, ensureOfficialCoin, settleOp };
