import "./site.js";
import { api } from "./lib/api.js";
import { h, $, clear } from "./lib/dom.js";

const sol = (l) => `${(Number(l || 0) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 })} SOL`;
export const usd = (n) => n >= 1e6 ? `$${+(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M` : `$${Math.round(n / 1e3)}K`;
const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };

function ladder(ms) {
  const el = $("#ladder"); if (!el) return;
  const full = el.classList.contains("full");
  clear(el);
  const items = (ms && ms.ladder) || [];
  const cap = (ms && ms.mcapUsd) || 0;
  for (const m of full ? items : items.slice(0, 4)) {
    const label = m.status === "done" ? "Unlocked" : m.status === "funding" ? "Paying out" : cap >= m.mcap ? "Unlocking" : "Locked";
    el.append(h("li", { class: m.status },
      h("div", { class: "cap" }, usd(m.mcap), h("span", { class: "st" }, label)),
      h("b", {}, m.title), h("p", {}, m.body),
      m.status === "locked" && cap ? h("div", { class: "bar" }, h("i", { style: { width: `${Math.min(100, (cap / m.mcap) * 100)}%` } })) : null));
  }
  if (!items.length) el.append(h("li", {}, h("p", {}, "Milestones load when the server is reachable.")));
  if (full) set("#ms-now", cap ? `TEK CITY market cap now: $${Math.round(cap).toLocaleString()}` : "TEK CITY market cap appears here once the coin is live.");
}

async function load() {
  try {
    const i = await api.get("/api/launchpad/info");
    set("#st-coins", `${(i.coins && i.coins.n) || 0} / ${i.spaces || 23}`);
    set("#st-sol", sol(i.coins && i.coins.l));
    set("#st-pool", sol(i.rewards && i.rewards.poolLamports));
    ladder(i.milestones);
  } catch { ladder(null); }
}
function tick() { const d = new Date(); set("#st-next", `${String(59 - d.getMinutes()).padStart(2, "0")}:${String(59 - d.getSeconds()).padStart(2, "0")}`); }
load(); tick(); setInterval(tick, 1000); setInterval(load, 60000);
