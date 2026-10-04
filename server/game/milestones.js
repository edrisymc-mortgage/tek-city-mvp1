"use strict";
// TEK CITY market-cap milestones. When the TEK CITY coin's market cap (read from pump.fun) first reaches
// a rung, it unlocks permanently and grants bonus free spins to every player, once. Gameplay only:
// milestones never send SOL or tokens to anyone.
const db = require("../db/pool");
const sol = require("../chain/solana");
const { activity } = require("../audit");

// Gameplay-only milestones: every rung grants bonus spins to every player. Nothing here sends SOL or tokens.
const LADDER = [
  { id: "m100k", mcap: 100_000, title: "Free spin for everyone", body: "Every player gets a bonus free spin.", rewards: [{ kind: "spins", n: 1 }] },
  { id: "m1m", mcap: 1_000_000, title: "2 free spins for everyone", body: "Every player gets 2 bonus free spins.", rewards: [{ kind: "spins", n: 2 }] },
  { id: "m8m", mcap: 8_000_000, title: "3 free spins for everyone", body: "Every player gets 3 bonus free spins.", rewards: [{ kind: "spins", n: 3 }] },
  { id: "m32m", mcap: 32_000_000, title: "5 free spins for everyone", body: "Every player gets 5 bonus free spins.", rewards: [{ kind: "spins", n: 5 }] },
  { id: "m100m", mcap: 100_000_000, title: "10 free spins for everyone", body: "Every player gets 10 bonus free spins.", rewards: [{ kind: "spins", n: 10 }] },
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

async function runReward(m, rw) {
  if (rw.kind !== "spins") return { done: false, note: "Retired reward type." };
  const r = await db.query(`UPDATE player_resources SET bonus_total = bonus_total + $1, bonus_left = bonus_left + $1`, [rw.n]);
  return { done: true, note: `${rw.n} free spin${rw.n > 1 ? "s" : ""} added for ${r.rowCount} players.` };
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

module.exports = { configure, tick, summary, refreshMarket, LADDER };
