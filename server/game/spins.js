"use strict";
// Free spins: every wallet's first spin is free (STARTER_SPINS, default 1). After that, one spin for every
// TOKENS_PER_SPIN tokens bought, plus bonus spins (passing START, the Vault, milestones).
// A buy is an on-chain transaction signed (fee-paid) by one of the player's wallets in which that
// wallet gained TEK CITY and paid for it (spent SOL beyond fees, or gave up another token).
// Plain transfers in from another wallet don't count, so tokens can't be passed around to farm spins.
// Each transaction signature is counted once (primary key), across all accounts.
const db = require("../db/pool");
const sol = require("../chain/solana");
const { fail } = require("../security/util");

let CFG = null;
function configure(config) { CFG = config; }
const enabled = () => !!(CFG && CFG.spins.mint && CFG.spins.mode === "bought");
const holderMode = () => !!(CFG && CFG.spins.mint && CFG.spins.mode === "holder");
const ownedMode = () => !!(CFG && CFG.spins.mint && CFG.spins.mode === "owned");

const FEE_SLACK = 100000; // lamports: more than any normal tx fee + priority fee
const lastScan = new Map(); // wallet -> ms
const scanning = new Map(); // wallet -> promise

async function walletsFor(userId) {
  const r = await db.query(
    `SELECT address FROM wallet_accounts WHERE user_id = $1 AND unlinked_at IS NULL
     ${CFG && CFG.launchpad.pumpBioLink ? "UNION SELECT address FROM pump_links WHERE user_id = $1 AND verified_at IS NOT NULL" : ""}`, [userId]);
  return [...new Set(r.rows.map((x) => x.address))];
}

function isBuy(t, wallet, mint) {
  if (!t || !t.meta || t.meta.err) return null;
  const e = sol.effects(t, wallet, mint);
  if (e.keys[0] !== wallet || !(e.tokensGained > 0)) return null;
  const others = (arr) => (arr || []).filter((b) => b.owner === wallet && b.mint !== mint)
    .reduce((m, b) => (m[b.mint] = (m[b.mint] || 0) + Number(b.uiTokenAmount.uiAmount || 0), m), {});
  const pre = others(t.meta.preTokenBalances), post = others(t.meta.postTokenBalances);
  const paidToken = Object.keys(pre).some((m) => (post[m] || 0) < pre[m]);
  if (e.spentLamports <= FEE_SLACK && !paidToken) return null;
  return { tokens: e.tokensGained, spent: Math.max(0, e.spentLamports) };
}

async function scanWallet(userId, wallet) {
  const mint = CFG.spins.mint;
  const accts = await sol.rpc("getTokenAccountsByOwner", [wallet, { mint }, { encoding: "jsonParsed" }]);
  for (const a of (accts && accts.value) || []) {
    const ta = a.pubkey;
    const cur = (await db.query(`SELECT last_sig FROM tek_scan WHERE token_account = $1`, [ta])).rows[0];
    const sigs = await sol.rpc("getSignaturesForAddress", [ta, { limit: 40, ...(cur && cur.last_sig ? { until: cur.last_sig } : {}) }]) || [];
    if (!sigs.length) continue;
    for (const s of sigs.slice().reverse()) {
      if (s.err) continue;
      const seen = await db.query(`SELECT 1 FROM tek_buys WHERE signature = $1`, [s.signature]);
      if (seen.rowCount) continue;
      let t = null;
      try { t = await sol.rpc("getTransaction", [s.signature, { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }]); } catch { continue; }
      const b = isBuy(t, wallet, mint);
      if (b) {
        await db.query(
          `INSERT INTO tek_buys (signature, user_id, wallet, tokens, spent_lamports, block_time)
           VALUES ($1,$2,$3,$4,$5, to_timestamp($6)) ON CONFLICT (signature) DO NOTHING`,
          [s.signature, userId, wallet, b.tokens, b.spent, s.blockTime || Math.floor(Date.now() / 1000)]);
      }
    }
    await db.query(
      `INSERT INTO tek_scan (token_account, last_sig, updated_at) VALUES ($1,$2,now())
       ON CONFLICT (token_account) DO UPDATE SET last_sig = EXCLUDED.last_sig, updated_at = now()`, [ta, sigs[0].signature]);
  }
}

async function refresh(userId, wallets, force = false) {
  await Promise.all(wallets.map(async (w) => {
    if (!force && Date.now() - (lastScan.get(w) || 0) < 60e3) return;
    if (scanning.has(w)) return scanning.get(w);
    const p = scanWallet(userId, w).catch(() => {}).finally(() => { scanning.delete(w); lastScan.set(w, Date.now()); });
    scanning.set(w, p);
    return p;
  }));
}

async function status(userId, { wait = false, force = false } = {}) {
  if (!enabled()) return { enabled: false };
  const per = CFG.spins.tokensPerSpin;
  const wallets = await walletsFor(userId);
  const p = (await db.query(`SELECT spins_used, bonus_total FROM player_resources WHERE user_id = $1`, [userId])).rows[0] || { spins_used: 0, bonus_total: 0 };
  const starter = CFG.spins.starterSpins;
  if (!wallets.length) return { enabled: true, wallet: null, bought: 0, starter, bonus: Number(p.bonus_total) || 0, earned: 0, used: p.spins_used, left: 0, tokensPerSpin: per, mint: CFG.spins.mint, next: per };
  const job = refresh(userId, wallets, force);
  if (wait) await Promise.race([job, new Promise((r) => setTimeout(r, 12000))]);
  const bought = Number((await db.query(`SELECT COALESCE(SUM(tokens),0) AS t FROM tek_buys WHERE user_id = $1`, [userId])).rows[0].t);
  let balance = null;
  try { balance = await sol.tokenBalance(wallets[0], CFG.spins.mint); } catch { /* optional display only */ }
  const bonus = Number(p.bonus_total) || 0;
  const earned = starter + Math.floor(bought / per) + bonus;
  return {
    enabled: true, wallet: wallets[0], wallets, balance, bought, starter, bonus, earned, used: p.spins_used,
    left: Math.max(0, earned - p.spins_used), tokensPerSpin: per, mint: CFG.spins.mint, next: per - (bought % per),
  };
}

async function requireSpin(userId) {
  if (!enabled()) return null;
  const s = await status(userId, { wait: true });
  if (!s.wallet) fail(403, "wallet_required", `Connect a Solana wallet to spin. Your first spin is free, then every ${s.tokensPerSpin.toLocaleString()} TEK CITY you buy = 1 more.`);
  if (s.left < 1) fail(409, "no_spins", `No spins left. Every ${s.tokensPerSpin.toLocaleString()} TEK CITY you buy = 1 free spin. Buy ${Math.ceil(s.next).toLocaleString()} more for your next one.`);
  return s;
}

// Holder mode: the per-round free spin requires a signed-in wallet (signature-verified, from the session's
// account) holding at least TOKENS_PER_SPIN of OFFICIAL_TOKEN_MINT. Balance is re-read from chain each time.
async function signedWallets(userId) {
  const r = await db.query(`SELECT address FROM wallet_accounts WHERE user_id = $1 AND unlinked_at IS NULL`, [userId]);
  return r.rows.map((x) => x.address);
}
async function holderStatus(userId, { fresh = false } = {}) {
  if (!holderMode()) return null;
  const need = CFG.spins.tokensPerSpin, wallets = await signedWallets(userId);
  let balance = 0;
  for (const w of wallets) { if (fresh) sol.bustBalance(w, CFG.spins.mint); balance += await sol.tokenBalance(w, CFG.spins.mint); }
  return { required: need, balance, eligible: wallets.length > 0 && balance >= need, wallet: wallets[0] || null, mint: CFG.spins.mint };
}
async function requireHolder(userId) {
  if (!holderMode()) return null;
  let h;
  try { h = await holderStatus(userId, { fresh: true }); }
  catch { fail(503, "rpc_error", "Couldn't check your TEK CITY balance on Solana right now. Try again in a moment."); }
  if (!h.wallet) fail(403, "wallet_required", "Connect a Solana wallet to spin.");
  if (!h.eligible) fail(403, "holder_required", `Free spins are for wallets holding at least ${h.required.toLocaleString()} TEK CITY. This wallet holds ${Math.floor(h.balance).toLocaleString()}.`);
  return h;
}

// Owned mode: each round, 1 spin per TOKENS_PER_SPIN held across the player's signed-in wallets and verified
// pump.fun profile (read-only). Balances are read from Solana on the server, never from the browser.
async function ownedStatus(userId, { fresh = false } = {}) {
  if (!ownedMode()) return null;
  const per = CFG.spins.tokensPerSpin;
  const signed = await signedWallets(userId);
  const wallets = await walletsFor(userId);
  let balance = 0;
  for (const w of wallets) { if (fresh) sol.bustBalance(w, CFG.spins.mint); balance += await sol.tokenBalance(w, CFG.spins.mint); }
  return { owned: true, wallet: signed[0] || null, wallets, balance, allowance: Math.floor(balance / per), tokensPerSpin: per, mint: CFG.spins.mint, starter: CFG.spins.starterSpins };
}
async function requireOwned(userId) {
  if (!ownedMode()) return null;
  let o;
  try { o = await ownedStatus(userId, { fresh: true }); }
  catch { fail(503, "rpc_error", "Couldn't check your TEK CITY balance on Solana right now. Try again in a moment."); }
  if (!o.wallet) fail(403, "wallet_required", "Connect a Solana wallet to spin.");
  return o;
}

function bust(wallet) { if (wallet) { lastScan.delete(wallet); if (CFG && CFG.spins.mint) sol.bustBalance(wallet, CFG.spins.mint); } }

module.exports = { configure, enabled, holderMode, ownedMode, ownedStatus, requireOwned, holderStatus, requireHolder, status, requireSpin, bust, isBuy };
