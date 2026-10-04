"use strict";
// Community rewards: the pool lives in a dedicated hot wallet that receives each space coin's community fee share.
// - Landing on the Community Vault wins JACKPOT_BPS of the pool.
// - Every hour HOURLY_BPS of the pool is split pro-rata among the top TEK CITY holders (linked player wallets).
// Without REWARDS_WALLET_SECRET everything is recorded as 'manual' payouts for the operator to send.
const { Keypair, PublicKey, SystemProgram, TransactionMessage, VersionedTransaction } = require("@solana/web3.js");
const db = require("../db/pool");
const sol = require("./solana");
const pump = require("./pump");
const { activity } = require("../audit");

let CFG = null, KP = null;
function configure(config) {
  CFG = config;
  const s = config.rewards.walletSecret.trim();
  if (s) {
    try {
      const bytes = s.startsWith("[") ? Uint8Array.from(JSON.parse(s)) : decodeB58(s);
      KP = Keypair.fromSecretKey(bytes);
    } catch { KP = null; console.error("[rewards] REWARDS_WALLET_SECRET is set but invalid; rewards run in manual mode."); }
  }
}
function decodeB58(str) {
  const A = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"; let n = 0n;
  for (const ch of str) { const i = A.indexOf(ch); if (i < 0) throw new Error("b58"); n = n * 58n + BigInt(i); }
  const out = []; while (n > 0n) { out.unshift(Number(n % 256n)); n /= 256n; }
  for (const ch of str) { if (ch !== "1") break; out.unshift(0); }
  return Uint8Array.from(out);
}
const poolAddress = () => (KP ? KP.publicKey.toBase58() : CFG.launchpad.communityWallet || null);
const auto = () => !!KP;

async function poolLamports() {
  const a = poolAddress(); if (!a) return 0;
  try { return Math.max(0, (await sol.solBalance(a)) - CFG.rewards.reserveLamports); } catch { return 0; }
}

async function signSend(tx) {
  tx.sign([KP]);
  return sol.sendAndConfirm(Buffer.from(tx.serialize()).toString("base64"));
}
async function transfer(list) { // [{wallet, lamports}] -> signatures per chunk
  const sigs = [];
  for (let i = 0; i < list.length; i += 10) {
    const chunk = list.slice(i, i + 10);
    const { blockhash } = (await sol.rpc("getLatestBlockhash", [{ commitment: "confirmed" }])).value;
    const msg = new TransactionMessage({
      payerKey: KP.publicKey, recentBlockhash: blockhash,
      instructions: chunk.map((p) => SystemProgram.transfer({ fromPubkey: KP.publicKey, toPubkey: new PublicKey(p.wallet), lamports: p.lamports })),
    }).compileToV0Message();
    sigs.push({ chunk, sig: await signSend(new VersionedTransaction(msg)) });
  }
  return sigs;
}

// Pull accrued community fee shares from Pump.fun into the pool (anyone may crank; the hot wallet pays the fee).
async function crankFees() {
  if (!KP) return 0;
  let n = 0;
  const coins = (await db.query(`SELECT mint FROM space_coins WHERE split_done`)).rows;
  for (const c of coins) {
    try {
      const built = await pump.collectFees({ payer: KP.publicKey.toBase58(), mint: c.mint });
      await signSend(VersionedTransaction.deserialize(Buffer.from(built.transaction, "base64"))); n++;
    } catch { /* nothing to collect or transient; skip */ }
  }
  return n;
}

let boostSource = async () => ({});
function setBoostSource(fn) { boostSource = fn; }
const keypair = () => KP;
async function bps() { const b = await boostSource().catch(() => ({})); return { jackpot: b.jackpotBps || CFG.rewards.jackpotBps, hourly: b.hourlyBps || CFG.rewards.hourlyBps, until: b.until || null }; }

// Linked player wallets (Phantom sign-in or verified pump.fun profile) holding at least one spin's worth of TEK CITY.
async function holders(max = CFG.rewards.topHolders) {
  const mint = CFG.spins.mint; if (!mint) return [];
  const rows = (await db.query(
    `SELECT DISTINCT ON (address) address, user_id, display_name FROM (
       SELECT wa.address, wa.user_id, u.display_name, wa.last_login_at AS t FROM wallet_accounts wa JOIN users u ON u.id = wa.user_id WHERE wa.unlinked_at IS NULL
       UNION ALL
       SELECT pl.address, pl.user_id, u.display_name, pl.verified_at AS t FROM pump_links pl JOIN users u ON u.id = pl.user_id WHERE pl.verified_at IS NOT NULL
     ) x ORDER BY address, t DESC NULLS LAST LIMIT 1000`)).rows;
  const out = [];
  for (const r of rows) {
    try { const b = await sol.tokenBalance(r.address, mint); if (b >= CFG.spins.tokensPerSpin) out.push({ ...r, balance: b }); } catch { /* skip */ }
  }
  return out.sort((a, b) => b.balance - a.balance).slice(0, max);
}

async function hourly(now = new Date()) {
  const hourKey = now.toISOString().slice(0, 13);
  const exists = await db.query(`INSERT INTO reward_runs (hour_key, mode) VALUES ($1, $2) ON CONFLICT (hour_key) DO NOTHING RETURNING id`, [hourKey, auto() ? "auto" : "manual"]);
  if (!exists.rowCount) return null;
  const runId = exists.rows[0].id;
  try {
    await crankFees();
    const pool = await poolLamports();
    const B = await bps();
    const budget = Math.min(Math.floor((pool * B.hourly) / 10000), CFG.rewards.maxPerHourLamports * (B.hourly > CFG.rewards.hourlyBps ? 2 : 1));
    const hs = await holders();
    const total = hs.reduce((a, h) => a + h.balance, 0);
    const pays = hs.map((h) => ({ ...h, bps: total ? Math.floor((h.balance / total) * 10000) : 0, lamports: total ? Math.floor((budget * h.balance) / total) : 0 }))
      .filter((p) => p.lamports >= CFG.rewards.minPayoutLamports);
    for (const p of pays) await db.query(`INSERT INTO reward_payouts (run_id, user_id, wallet, tek_balance, share_bps, lamports) VALUES ($1,$2,$3,$4,$5,$6)`, [runId, p.user_id, p.address, p.balance, p.bps, p.lamports]);
    let sent = 0;
    if (auto() && pays.length) {
      for (const { chunk, sig } of await transfer(pays.map((p) => ({ wallet: p.address, lamports: p.lamports })))) {
        for (const c of chunk) { await db.query(`UPDATE reward_payouts SET status = 'sent', signature = $3 WHERE run_id = $1 AND wallet = $2`, [runId, c.wallet, sig]); sent += c.lamports; }
      }
    }
    await db.query(`UPDATE reward_runs SET pool_lamports = $2, distributed_lamports = $3, holders = $4, status = $5 WHERE id = $1`, [runId, pool, sent, pays.length, auto() ? "done" : "manual"]);
    if (pays.length) await activity(null, "rewards", `Hourly community rewards: ${(budget / 1e9).toFixed(3)} SOL split across ${pays.length} TEK CITY holders.`);
  } catch (e) {
    await db.query(`UPDATE reward_runs SET status = 'error', note = $2 WHERE id = $1`, [runId, String(e.message || e).slice(0, 200)]);
  }
  return runId;
}

// Landing on the Community Vault wins the jackpot share of the pool.
async function jackpot({ userId, wallet, name, roundId }) {
  const pool = await poolLamports();
  const lamports = Math.floor((pool * (await bps()).jackpot) / 10000);
  if (lamports < CFG.rewards.minPayoutLamports) return { lamports: 0 };
  const id = (await db.query(`INSERT INTO jackpots (user_id, wallet, lamports, round_id) VALUES ($1,$2,$3,$4) RETURNING id`, [userId, wallet, lamports, roundId])).rows[0].id;
  if (auto()) {
    try {
      const [{ sig }] = await transfer([{ wallet, lamports }]);
      await db.query(`UPDATE jackpots SET status = 'sent', signature = $2 WHERE id = $1`, [id, sig]);
    } catch (e) { await db.query(`UPDATE jackpots SET status = 'error' WHERE id = $1`, [id]); }
  } else await db.query(`UPDATE jackpots SET status = 'manual' WHERE id = $1`, [id]);
  await activity(null, "rewards", `${name} landed on the Community Vault and won ${(lamports / 1e9).toFixed(3)} SOL from the community pool.`);
  return { lamports };
}

async function summary() {
  const [runs, jp] = await Promise.all([
    db.query(`SELECT hour_key, pool_lamports, distributed_lamports, holders, mode, status, created_at FROM reward_runs ORDER BY id DESC LIMIT 6`),
    db.query(`SELECT j.lamports, j.status, j.created_at, u.display_name FROM jackpots j LEFT JOIN users u ON u.id = j.user_id ORDER BY j.id DESC LIMIT 5`),
  ]);
  return {
    pool: poolAddress(), poolLamports: await poolLamports(), auto: auto(),
    ...(await bps().then((b) => ({ jackpotBps: b.jackpot, hourlyBps: b.hourly, boostUntil: b.until }))),
    runs: runs.rows, jackpots: jp.rows,
  };
}

module.exports = { configure, hourly, jackpot, summary, poolAddress, holders, auto, transfer, keypair, setBoostSource };
