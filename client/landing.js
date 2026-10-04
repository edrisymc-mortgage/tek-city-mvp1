import "./site.js";
import { api } from "./lib/api.js";
import { $ } from "./lib/dom.js";

let s = null;
async function load() { try { s = await api.get("/api/state"); paint(); } catch { /* offline */ } }
function paint() {
  if (!s || !s.round) return;
  $("#t-round").textContent = s.round.number;
  $("#t-stab").textContent = `${s.stability}%`;
  $("#t-players").textContent = s.players.length;
  $("#hero-vault").textContent = `${s.vault.progress % s.vault.milestoneSize} / ${s.vault.milestoneSize}`;
}
function tick() {
  if (!s || !s.round) return;
  const ms = Math.max(0, new Date(s.round.endsAt) - Date.now());
  $("#t-count").textContent = `${String(Math.floor(ms / 60000)).padStart(2, "0")}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
  if (ms === 0) setTimeout(load, 4000);
}
load(); setInterval(tick, 1000); setInterval(load, 60000);
