"use strict";
// TEK CITY market-cap milestones. When the TEK CITY coin's market cap (read from pump.fun) first
// reaches a milestone, it unlocks permanently and its reward runs once:
//   spins      +N free spins for every player
//   airdrop    $X of SOL to every eligible holder wallet (paid from the rewards wallet)
//   burn       burn a share of the TEK CITY held by the rewards wallet (treasury)
//   drop       distribute a share of the treasury's TEK CITY to holders, pro rata
//   boost      raise the Vault jackpot / hourly share for a period
// Rewards that need funds wait in "funding" until the rewards wallet can cover them, then retry.
const { PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } = require("@solana/web3.js");
const db = require("../db/pool");
const sol = require("../chain/solana");
const rewards = require("../chain/rewards");
const { activity } = require("../audit");

const LADDER = [
  { id: "m50k", mcap: 50_000, title: "$10 to every holder", body: "Every holder wallet with 500K+ TEK CITY gets $10 in SOL.", rewards: [{ kind: "airdrop", usd: 10 }] },
  { id: "m100k", mcap: 100_000, title: "Free spin for everyone", body: "Every player gets a bonus free spin.", rewards: [{ kind: "spins", n: 1 }] },
  { id: "m250k", mcap: 250_000, title: "First burn", body: "25% of the TEK CITY treasury is burned for good.", rewards: [{ kind: "burn", bps: 2500 }] },
  { id: "m500k", mcap: 500_000, title: "Holder token drop", body: "20% of the TEK CITY treasury is split across holders by balance.", rewards: [{ kind: "drop", bps: 2000 }] },
  { id: "m1m", mcap: 1_000_000, title: "Jackpot week", body: "The Vault pays 80% of the pool for 7 days, plus 2 free spins for everyone.", rewards: [{ kind: "boost", jackpotBps: 8000, hours: 168 }, { kind: "spins", n: 2 }] },
  { id: "m2m", mcap: 2_000_000, title: "$25 to every holder", body: "Every holder wallet with 500K+ TEK CITY gets $25 in SOL.", rewards: [{ kind: "airdrop", usd: 25 }] },
  { id: "m4m", mcap: 4_000_000, title: "Second burn", body: "50% of the remaining treasury is burned.", rewards: [{ kind: "burn", bps: 5000 }] },
  { id: "m8m", mcap: 8_000_000, title: "Double hourly rewards", body: "Hourly holder payouts go from 20% to 40% of the pool for 30 days, plus 3 free spins for everyone.", rewards: [{ kind: "boost", hourlyBps: 4000, hours: 720 }, { kind: "spins", n: 3 }] },
  { id: "m16m", mcap: 16_000_000, title: "$50 to every holder", body: "Every holder wallet with 500K+ TEK CITY gets $50 in SOL, plus 3 free spins for everyone.", rewards: [{ kind: "airdrop", usd: 50 }, { kind: "spins", n: 3 }] },
  { id: "m32m", mcap: 32_000_000, title: "Jackpot month", body: "The Vault pays 80% of the pool for 30 days, plus 5 free spins for everyone.", rewards: [{ kind: "boost", jackpotBps: 8000, hours: 720 }, { kind: "spins", n: 5 }] },
  { id: "m64m", mcap: 64_000_000, title: "$100 to every holder", body: "Every holder wallet with 500K+ TEK CITY gets $100 in SOL.", rewards: [{ kind: "airdrop", usd: 100 }] },
  { id: "m100m", mcap: 100_000_000, title: "Final drop", body: "The rest of the treasury is split across holders by balance.", rewards: [{ kind: "drop", bps: 10000 }] },
];

let CFG = null;
const state = { mcapUsd: null, athUsd: null, solUsd: null, at: 0 };
function configure(config) { CFG = config; }

async function getJson(url) {
  const r = await fetch(url, { headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (TEK CITY)", origin: "https://pump.fun" }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
async function solUsd() {
  try { const j = await getJson("https://lite-api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112"); const p = Number(j.So11111111111111111111111111111111111111112.usdPrice); if (p > 0) return p; } catch { /* fallback */ }
  const j = await getJson("https://frontend-api-v3.pump.fun/sol-price"); return Number(j.solPrice);
}
async function refreshMarket() {
  const mint = CFG.spins.mint; if (!mint) return state;
  try {
    const c = await getJson(`https://frontend-api-v3.pump.fun/coins-v2/${mint}`);
    state.mcapUsd = Number(c.usd_market_cap) || 0; state.athUsd = Number(c.ath_market_cap) || state.mcapUsd;
  } catch { /* keep last */ }
  try { state.solUsd = await solUsd(); } catch { /* keep last */ }
  state.at = Date.now();
  return state;
}

// ---- chain helpers for the treasury (rewards hot wallet) ----
async function mintInfo(mint) {
  const r = await sol.rpc("getAccountInfo", [mint, { encoding: "jsonParsed" }]);
  return { program: r.value.owner, decimals: r.value.data.parsed.info.decimals };
}
async function treasuryAccount(mint) {
  const owner = rewards.poolAddress();
  const r = await sol.rpc("getTokenAccountsByOwner", [owner, { mint }, { encoding: "jsonParsed" }]);
  const a = ((r && r.value) || []).sort((x, y) => Number(y.account.data.parsed.info.tokenAmount.amount) - Number(x.account.data.parsed.info.tokenAmount.amount))[0];
  return a ? { address: a.pubkey, raw: BigInt(a.account.data.parsed.info.tokenAmount.amount) } : null;
}
const u64 = (n) => { const b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(n)); return b; };
async function sendIx(ixs) {
  const kp = rewards.keypair();
  const { blockhash } = (await sol.rpc("getLatestBlockhash", [{ commitment: "confirmed" }])).value;
  const tx = new VersionedTransaction(new TransactionMessage({ payerKey: kp.publicKey, recentBlockhash: blockhash, instructions: ixs }).compileToV0Message());
  tx.sign([kp]);
  return sol.sendAndConfirm(Buffer.from(tx.serialize()).toString("base64"));
}

async function eligibleHolders() { return rewards.holders(200); }

// ---- reward executors: return { done, note, sigs } ----
async function runReward(m, rw) {
  if (rw.kind === "spins") {
    const r = await db.query(`UPDATE player_resources SET bonus_total = bonus_total + $1, bonus_left = bonus_left + $1`, [rw.n]);
    return { done: true, note: `${rw.n} free spin${rw.n > 1 ? "s" : ""} added for ${r.rowCount} players.` };
  }
  if (rw.kind === "boost") {
    const until = new Date(Date.now() + rw.hours * 3600e3).toISOString();
    return { done: true, note: `Boost active until ${until.slice(0, 16).replace("T", " ")} UTC.`, boost: { ...rw, until } };
  }
  if (!rewards.auto()) return { done: false, note: "Waiting for the rewards wallet to be configured." };
  if (rw.kind === "airdrop") {
    const hs = await eligibleHolders();
    if (!hs.length) return { done: false, note: "No eligible holder wallets yet." };
    const price = state.solUsd || (await solUsd());
    const each = Math.floor((rw.usd / price) * 1e9);
    const need = each * hs.length + 10_000_000;
    const have = await sol.solBalance(rewards.poolAddress());
    if (have < need + CFG.rewards.reserveLamports) return { done: false, note: `Needs ${(need / 1e9).toFixed(2)} SOL in the rewards wallet for ${hs.length} holders.` };
    const sent = await rewards.transfer(hs.map((h) => ({ wallet: h.address, lamports: each })));
    return { done: true, note: `$${rw.usd} (${(each / 1e9).toFixed(4)} SOL) sent to ${hs.length} holders.`, sigs: sent.map((s) => s.sig) };
  }
  const mint = CFG.spins.mint;
  const info = await mintInfo(mint);
  const tre = await treasuryAccount(mint);
  if (!tre || tre.raw === 0n) return { done: false, note: "The treasury holds no TEK CITY yet." };
  const amount = (tre.raw * BigInt(rw.bps)) / 10000n;
  if (amount === 0n) return { done: false, note: "Treasury amount too small." };
  const owner = rewards.keypair().publicKey, prog = new PublicKey(info.program), mintPk = new PublicKey(mint);
  if (rw.kind === "burn") {
    const ix = new TransactionInstruction({ programId: prog, keys: [
      { pubkey: new PublicKey(tre.address), isSigner: false, isWritable: true }, { pubkey: mintPk, isSigner: false, isWritable: true }, { pubkey: owner, isSigner: true, isWritable: false },
    ], data: Buffer.concat([Buffer.from([15]), u64(amount), Buffer.from([info.decimals])]) });
    const sig = await sendIx([ix]);
    return { done: true, note: `Burned ${(Number(amount) / 10 ** info.decimals).toLocaleString()} TEK CITY.`, sigs: [sig] };
  }
  if (rw.kind === "drop") {
    const hs = await eligibleHolders();
    if (!hs.length) return { done: false, note: "No eligible holder wallets yet." };
    const total = hs.reduce((a, h) => a + h.balance, 0);
    const sigs = [];
    for (let i = 0; i < hs.length; i += 8) {
      const ixs = [];
      for (const h of hs.slice(i, i + 8)) {
        const share = (amount * BigInt(Math.floor((h.balance / total) * 1e6))) / 1000000n;
        if (share === 0n) continue;
        const dest = await sol.rpc("getTokenAccountsByOwner", [h.address, { mint }, { encoding: "jsonParsed" }]);
        const d = dest && dest.value && dest.value[0]; if (!d) continue;
        ixs.push(new TransactionInstruction({ programId: prog, keys: [
          { pubkey: new PublicKey(tre.address), isSigner: false, isWritable: true }, { pubkey: mintPk, isSigner: false, isWritable: false },
          { pubkey: new PublicKey(d.pubkey), isSigner: false, isWritable: true }, { pubkey: owner, isSigner: true, isWritable: false },
        ], data: Buffer.concat([Buffer.from([12]), u64(share), Buffer.from([info.decimals])]) }));
      }
      if (ixs.length) sigs.push(await sendIx(ixs));
    }
    return { done: true, note: `${(Number(amount) / 10 ** info.decimals).toLocaleString()} TEK CITY split across ${hs.length} holders.`, sigs };
  }
  return { done: false, note: "Unknown reward." };
}

let running = false;
async function tick() {
  if (running || !CFG || !CFG.spins.mint) return;
  running = true;
  try {
    if (Date.now() - state.at > 5 * 60e3) await refreshMarket();
    const peak = Math.max(state.mcapUsd || 0, state.athUsd || 0);
    for (const m of LADDER) {
      if (peak < m.mcap) break;
      await db.query(`INSERT INTO milestones (id, reached_at, mcap_usd) VALUES ($1, now(), $2) ON CONFLICT (id) DO NOTHING`, [m.id, Math.round(peak)]);
      const row = (await db.query(`SELECT * FROM milestones WHERE id = $1 FOR UPDATE SKIP LOCKED`, [m.id])).rows[0];
      if (!row || row.status === "done") continue;
      if (row.last_try && Date.now() - new Date(row.last_try) < 10 * 60e3 && row.status === "funding") continue;
      const results = row.results || {};
      let all = true;
      for (let i = 0; i < m.rewards.length; i++) {
        if (results[i] && results[i].done) continue;
        let out;
        try { out = await runReward(m, m.rewards[i]); } catch (e) { out = { done: false, note: String(e.message || e).slice(0, 160) }; }
        results[i] = out; if (!out.done) all = false;
      }
      await db.query(`UPDATE milestones SET status = $2, results = $3, last_try = now(), done_at = CASE WHEN $2 = 'done' THEN now() ELSE done_at END WHERE id = $1`, [m.id, all ? "done" : "funding", JSON.stringify(results)]);
      if (row.status !== "done" && all) await activity(null, "milestone", `TEK CITY hit $${(m.mcap / 1000).toLocaleString()}K market cap: ${m.title}.`);
    }
  } finally { running = false; }
}

// Active boosts (jackpot / hourly share) from completed milestones.
async function boosts() {
  const rows = (await db.query(`SELECT results FROM milestones WHERE status = 'done'`)).rows;
  const now = Date.now(), out = {};
  for (const r of rows) for (const x of Object.values(r.results || {})) {
    if (x && x.boost && new Date(x.boost.until).getTime() > now) {
      if (x.boost.jackpotBps) out.jackpotBps = Math.max(out.jackpotBps || 0, x.boost.jackpotBps);
      if (x.boost.hourlyBps) out.hourlyBps = Math.max(out.hourlyBps || 0, x.boost.hourlyBps);
      out.until = x.boost.until;
    }
  }
  return out;
}

async function summary() {
  const rows = new Map((await db.query(`SELECT id, status, reached_at, done_at, results FROM milestones`)).rows.map((r) => [r.id, r]));
  return {
    enabled: !!(CFG && CFG.spins.mint), mcapUsd: state.mcapUsd, athUsd: state.athUsd,
    ladder: LADDER.map((m) => {
      const r = rows.get(m.id);
      const sigs = r ? Object.values(r.results || {}).flatMap((x) => (x && x.sigs) || []) : [];
      return { id: m.id, mcap: m.mcap, title: m.title, body: m.body, status: r ? r.status : "locked", reachedAt: r && r.reached_at, doneAt: r && r.done_at, txs: sigs.slice(0, 3) };
    }),
  };
}

module.exports = { configure, tick, summary, boosts, refreshMarket, LADDER };
