"use strict";
// Free spins come from holding TEK CITY: one spin for every TOKENS_PER_SPIN tokens held.
// Spins are earned on the highest balance ever seen (buying more grants more; selling and re-buying can't farm).
const db = require("../db/pool");
const sol = require("../chain/solana");
const { fail } = require("../security/util");

let CFG = null;
function configure(config) { CFG = config; }
const enabled = () => !!(CFG && CFG.spins.mint);

async function status(userId) {
  if (!enabled()) return { enabled: false };
  const per = CFG.spins.tokensPerSpin;
  const w = (await db.query(`SELECT address FROM wallet_accounts WHERE user_id = $1 AND unlinked_at IS NULL LIMIT 1`, [userId])).rows[0];
  const p = (await db.query(`SELECT spins_used, spins_peak FROM player_resources WHERE user_id = $1`, [userId])).rows[0] || { spins_used: 0, spins_peak: 0 };
  if (!w) return { enabled: true, wallet: null, balance: 0, earned: 0, used: p.spins_used, left: 0, tokensPerSpin: per, mint: CFG.spins.mint };
  let balance = 0;
  try { balance = await sol.tokenBalance(w.address, CFG.spins.mint); } catch { balance = Number(p.spins_peak) || 0; }
  const peak = Math.max(Number(p.spins_peak) || 0, balance);
  if (peak > Number(p.spins_peak)) await db.query(`UPDATE player_resources SET spins_peak = $2 WHERE user_id = $1`, [userId, peak]);
  const earned = Math.floor(peak / per);
  return { enabled: true, wallet: w.address, balance, earned, used: p.spins_used, left: Math.max(0, earned - p.spins_used), tokensPerSpin: per, mint: CFG.spins.mint, next: per - (peak % per) };
}

async function requireSpin(userId) {
  const s = await status(userId);
  if (!s.enabled) return null;
  if (!s.wallet) fail(403, "wallet_required", `Link a wallet holding TEK CITY to spin. Every ${s.tokensPerSpin.toLocaleString()} TEK CITY = 1 free spin.`);
  if (s.left < 1) fail(409, "no_spins", `No spins left. Every ${s.tokensPerSpin.toLocaleString()} TEK CITY you hold = 1 free spin. Buy ${Math.ceil(s.next).toLocaleString()} more for your next one.`);
  return s;
}

function bust(wallet) { if (wallet && CFG && CFG.spins.mint) sol.bustBalance(wallet, CFG.spins.mint); }

module.exports = { configure, enabled, status, requireSpin, bust };
