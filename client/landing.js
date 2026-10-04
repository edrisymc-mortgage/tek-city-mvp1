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
    set("#st-players", String(i.players || 0));
    ladder(i.milestones);
  } catch { ladder(null); }
}

// ------------------------------------------------------------ Community Fund page
const ASSET = (a) => (a === "SOL" ? "SOL" : `${a.slice(0, 4)}...${a.slice(-4)}`);
const amt = (x) => (x.asset === "SOL" ? sol(x.baseUnits) : `${BigInt(x.baseUnits).toLocaleString()} base units ${ASSET(x.asset)}`);
const sumList = (l) => (l && l.length ? l.map(amt).join(" · ") : "0");
const explorer = (kind, v, net) => `https://solscan.io/${kind}/${encodeURIComponent(v)}${net && net !== "mainnet-beta" ? `?cluster=${net}` : ""}`;
function walletRow(label, addr, net, note) {
  if (!addr) return h("div", { class: "cf-wallet" }, h("span", { class: "k" }, label), h("span", { class: "muted" }, "Not configured"));
  const btn = h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: async () => { try { await navigator.clipboard.writeText(addr); btn.textContent = "Copied"; } catch { btn.textContent = "Copy failed"; } } }, "Copy");
  return h("div", { class: "cf-wallet" }, h("span", { class: "k" }, label), h("code", { class: "mono" }, addr),
    h("div", { class: "row" }, btn, h("a", { class: "btn btn-ghost btn-sm", href: explorer("account", addr, net), target: "_blank", rel: "noopener" }, "View on Solscan")),
    note ? h("p", { class: "small muted" }, note) : null);
}
async function fund() {
  const root = $("#cf-root"); if (!root) return;
  let d;
  try { d = await api.get("/api/community-fund"); } catch { clear(root); root.append(h("p", { class: "muted" }, "Couldn't load the Community Fund right now.")); return; }
  const label = d.status === "active" ? "Active" : d.status === "paused" ? "Paused" : "Not Active";
  set("#cf-status", label);
  const t = d.totals || {}, pol = d.policies || {};
  const model = (pol.community_fund_model && pol.community_fund_model.text) || "";
  const token = (pol.token_utility_disclosure && pol.token_utility_disclosure.text) || "";
  clear(root);
  root.append(
    h("h2", {}, "How it's funded"), h("p", {}, model),
    d.status !== "active" ? h("p", { class: "muted" }, "The Community Fund is not active yet. Amounts below are records only; nothing is paid out while it is not active.") : null,
    h("h2", {}, "Wallets"),
    walletRow("Operator creator-reward wallet", d.operatorWallet, d.network, "Receives creator rewards from eligible TEK CITY-operated coins."),
    walletRow("Community Fund treasury", d.treasuryWallet, d.network, "Holds the Community Fund. Transfers out need approval through a multisig."),
    h("h2", {}, "Totals"),
    h("table", { class: "rules" }, h("tbody", {},
      [["Creator rewards verified", t.creatorRewardsVerified], ["Community Fund accrued (recorded, not yet transferred)", t.fundAccrued], ["Transferred to treasury (awaiting finalization)", t.fundTransferred],
       ["Verified at treasury", t.fundVerifiedAtTreasury], ["Rewards committed", t.rewardsCommitted], ["Rewards paid", t.rewardsPaid], ["Rewards available", t.rewardsAvailable]]
        .map(([k, v]) => h("tr", {}, h("th", {}, k), h("td", { class: "mono" }, sumList(v)))))),
    h("h2", {}, "Programs"),
    d.programs && d.programs.length ? h("ul", {}, d.programs.map((p) => h("li", {}, h("b", {}, p.name), ` (${p.status}) · ${p.purpose.replace(/_/g, " ")} · ${new Date(p.starts_at).toLocaleDateString()} to ${new Date(p.ends_at).toLocaleDateString()}`, h("p", { class: "small muted" }, p.description))))
      : h("p", { class: "muted" }, "No programs have been announced."),
    h("h2", {}, "Verified transactions"),
    (d.transfers || []).length || (d.payouts || []).length
      ? h("ul", {}, [...(d.transfers || []).map((x) => ({ ...x, kind: "Transfer to treasury" })), ...(d.payouts || []).map((x) => ({ ...x, kind: `Reward paid · ${x.program}` }))]
        .map((x) => h("li", {}, `${x.kind}: ${amt({ asset: x.asset, baseUnits: x.amount })} · `, h("a", { href: explorer("tx", x.signature, d.network), target: "_blank", rel: "noopener", class: "mono" }, `${x.signature.slice(0, 8)}...${x.signature.slice(-8)}`))))
      : h("p", { class: "muted" }, "No verified transactions yet."),
    h("h2", {}, "Disclosures"), h("p", { class: "small" }, d.disclosure), h("p", { class: "small" }, token),
    d.policyUrl ? h("p", { class: "small" }, h("a", { href: d.policyUrl, target: "_blank", rel: "noopener" }, "Full Community Fund policy")) : null,
  );
}

if ($("#cf-root")) fund(); else { load(); setInterval(load, 60000); }
