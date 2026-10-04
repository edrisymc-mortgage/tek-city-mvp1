"use strict";
// Free spins come from BUYING TEK CITY: one spin for every TOKENS_PER_SPIN tokens bought.
// A buy is an on-chain transaction signed (fee-paid) by one of the player's wallets in which that
// wallet gained TEK CITY and paid for it (spent SOL beyond fees, or gave up another token).
// Plain transfers in from another wallet don't count, so tokens can't be passed around to farm spins.
// Each transaction signature is counted once (primary key), across all accounts.
const db = require("../db/pool");
const sol = require("../chain/solana");
const { fail } = require("../security/util");

let CFG = null;
function configure(config) { CFG = config; }
const enabled = () => !!(CFG && CFG.spins.mint);

const FEE_SLACK = 100000; // lamports: more than any normal tx fee + priority fee
const lastScan = new Map(); // wallet -> ms
const scanning = new Map(); // wallet -> promise

async function walletsFor(userId) {
  const r = await db.query(
    `SELECT address FROM wallet_accounts WHERE user_id = $1 AND unlinked_at IS NULL
     UNION SELECT address FROM pump_links WHERE user_id = $1 AND verified_at IS NOT NULL`, [userId]);
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
  if (!wallets.length) return { enabled: true, wallet: null, bought: 0, bonus: Number(p.bonus_total) || 0, earned: 0, used: p.spins_used, left: 0, tokensPerSpin: per, mint: CFG.spins.mint, next: per };
  const job = refresh(userId, wallets, force);
  if (wait) await Promise.race([job, new Promise((r) => setTimeout(r, 12000))]);
  const bought = Number((await db.query(`SELECT COALESCE(SUM(tokens),0) AS t FROM tek_buys WHERE user_id = $1`, [userId])).rows[0].t);
  let balance = null;
  try { balance = await sol.tokenBalance(wallets[0], CFG.spins.mint); } catch { /* optional display only */ }
  const bonus = Number(p.bonus_total) || 0;
  const earned = Math.floor(bought / per) + bonus;
  return {
    enabled: true, wallet: wallets[0], wallets, balance, bought, bonus, earned, used: p.spins_used,
    left: Math.max(0, earned - p.spins_used), tokensPerSpin: per, mint: CFG.spins.mint, next: per - (bought % per),
  };
}

async function requireSpin(userId) {
  if (!enabled()) return null;
  const s = await status(userId, { wait: true });
  if (!s.wallet) fail(403, "wallet_required", `Link your wallet or pump.fun profile to spin. Every ${s.tokensPerSpin.toLocaleString()} TEK CITY you buy = 1 free spin.`);
  if (s.left < 1) fail(409, "no_spins", `No spins left. Every ${s.tokensPerSpin.toLocaleString()} TEK CITY you buy = 1 free spin. Buy ${Math.ceil(s.next).toLocaleString()} more for your next one.`);
  return s;
}

function bust(wallet) { if (wallet) { lastScan.delete(wallet); if (CFG && CFG.spins.mint) sol.bustBalance(wallet, CFG.spins.mint); } }

module.exports = { configure, enabled, status, requireSpin, bust, isBuy };
