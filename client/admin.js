// Operator console. All authority lives on the server; this page just calls admin endpoints.
import "./site.js";
import { api } from "./lib/api.js";
import { h, $, clear } from "./lib/dom.js";
import { listWallets, signInWith, walletFor, signTx, shortAddr } from "./lib/wallet.js";
import { renderIcons } from "./lib/icons.js";

const root = $("#admin-root");
const msg = h("p", { class: "form-status", role: "status" });

async function load() {
  clear(root);
  await api.session();
  let ov;
  try { ov = await api.get("/api/admin/overview"); }
  catch (e) {
    if (e.status === 404) { root.append(h("p", {}, "The admin console is disabled on this server.")); return; }
    root.append(h("p", {}, e.message), signInBlock(e.code === "reauth_required" ? "reauth" : "login"), msg);
    renderIcons(root);
    return;
  }
  const btn = (label, fn, cls = "btn-ghost") => h("button", { class: `btn ${cls} btn-sm`, onclick: async () => { try { await fn(); msg.textContent = "Done."; await load(); } catch (e) { msg.textContent = e.message; if (e.code === "reauth_required") root.prepend(signInBlock("reauth")); } } }, label);
  const reason = h("input", { placeholder: "Pause reason", maxlength: 140 });
  const evTitle = h("input", { placeholder: "Announcement title", maxlength: 80 });
  const evBody = h("input", { placeholder: "Announcement text", maxlength: 400 });
  root.append(
    msg,
    h("h2", {}, "City"),
    h("p", {}, `Day ${ov.city.day} · ${ov.city.day_status} · Stability ${ov.city.stability} · ${ov.city.paused ? "PAUSED" : "running"} · DB ${ov.dbMode}`),
    h("div", { class: "copy-row" }, reason,
      ov.city.paused ? btn("Resume city", () => api.post("/api/admin/pause", { paused: false }), "btn-primary") : btn("Emergency pause", () => api.post("/api/admin/pause", { paused: true, reason: reason.value || undefined }), "btn-red"),
      btn("Settle current round now", () => api.post("/api/admin/settle", {}))),
    h("h2", { class: "mt32" }, "Recent rounds"),
    h("table", { class: "simple" }, h("tbody", {}, ov.rounds.map((r) => h("tr", {}, h("td", {}, r.round_key), h("td", {}, r.status), h("td", {}, r.settled_at || ""), h("td", {}, r.settlement && r.settlement.event ? r.settlement.event.title : ""))))),
    h("h2", { class: "mt32" }, "Metrics"),
    h("p", {}, `Users: ${ov.users.map((u) => `${u.kind} ${u.n}`).join(", ") || 0} · Actions last hour: ${ov.actionsLastHour.map((a) => `${a.action_type} ${a.n}`).join(", ") || 0} · Open abuse flags: ${ov.openAbuseFlags} · New support: ${ov.newSupport}`),
    h("h2", { class: "mt32" }, "Feature flags"),
    h("table", { class: "simple" }, h("tbody", {}, ov.flags.map((f) => h("tr", {}, h("td", {}, h("b", {}, f.key)), h("td", {}, f.description), h("td", {}, f.enabled ? "on" : "off"),
      h("td", {}, f.locked ? "locked by env" : btn(f.enabled ? "Turn off" : "Turn on", () => api.post("/api/admin/flags", { key: f.key, enabled: !f.enabled }))))))),
    h("h2", { class: "mt32" }, "Announcement"),
    h("div", { class: "copy-row" }, evTitle, evBody, btn("Post", () => api.post("/api/admin/events", { title: evTitle.value, body: evBody.value }))),
    h("h2", { class: "mt32" }, "Abuse flags · Audit log · Support"),
    h("div", { class: "copy-row" },
      btn("Load abuse flags", async () => show((await api.get("/api/admin/abuse")).flags)),
      btn("Load audit log", async () => show((await api.get("/api/admin/audit?limit=100")).entries)),
      btn("Load support reports", async () => show((await api.get("/api/admin/support")).reports)),
      h("a", { class: "btn btn-ghost btn-sm", href: "/api/admin/export" }, "Download JSON backup")),
    h("pre", { id: "dump", class: "mono small" }));
  const fund = h("div", { class: "mt32" }); root.insertBefore(fund, root.children[1] || null);
  renderFund(fund).catch((e) => { fund.textContent = e.message; });
  renderIcons(root);
}

// Community Fund: claim creator rewards, move the fund share (max 20%) to the treasury, pay players.
// Every button builds a transaction on the server; you approve it in your own wallet. Nothing moves without that.
const SOL = (l) => `${(Number(l || 0) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL`;
async function renderFund(el) {
  let o;
  try { o = await api.get("/api/admin/community/ops"); }
  catch (e) { el.append(h("h2", {}, "Community Fund"), h("p", { class: "small" }, e.code === "missing_role" ? "This wallet has no Community Fund role." : e.message)); return; }
  const status = h("p", { class: "form-status", role: "status" });
  const as = o.signedInAs, isOp = as === o.operatorWallet, isTr = as === o.treasuryWallet;
  const run = (path) => async (ev) => {
    ev.target.disabled = true; status.textContent = "Preparing…";
    try {
      const b = await api.post(path, {});
      status.textContent = `${b.summary} Approve it in your wallet.`;
      const w = await walletFor(b.wallet);
      const signed = await signTx(w, b.transaction, "mainnet-beta");
      status.textContent = "Sending…";
      const r = await api.post(`/api/admin/community/ops/${b.opId}/submit`, { signedTx: signed });
      status.textContent = r.pending ? r.message : `Done. Confirmed on Solana: ${r.signature}`;
      setTimeout(() => { clear(el); renderFund(el); }, 2500);
    } catch (e) { status.textContent = /reject|denied|cancel/i.test(String(e.message)) ? "You declined in your wallet. Nothing moved." : e.message; ev.target.disabled = false; }
  };
  const earn = (cat) => ((o.earningsPending.find((x) => x.category === cat) || { n: 0 }).n);
  el.append(
    h("h2", {}, "Community Fund"),
    h("p", { class: "small" }, `Fund share: ${o.bps / 100}% of verified creator rewards (never more than 20%). Signed in as ${shortAddr(as)}${isOp ? " (operator wallet)" : isTr ? " (treasury wallet)" : ""}.`),
    h("table", { class: "simple" }, h("tbody", {},
      h("tr", {}, h("td", {}, "Fund share waiting to move"), h("td", {}, SOL(o.fundShareWaitingLamports))),
      h("tr", {}, h("td", {}, "Rewards seen, waiting for Solana to finalize"), h("td", {}, String(o.detectedAwaitingFinalization))),
      h("tr", {}, h("td", {}, "Treasury: verified fund SOL not yet paid"), h("td", {}, SOL(o.treasury.ledgerLamports))),
      h("tr", {}, h("td", {}, "Available for payouts"), h("td", {}, SOL(o.treasury.availableLamports))),
      h("tr", {}, h("td", {}, "Player earnings waiting"), h("td", {}, `Leaderboard ${earn("leaderboard")} · Vault ${earn("vault")} · Milestones ${earn("milestone")}`)),
      h("tr", {}, h("td", {}, "Player payouts"), h("td", {}, o.enabled ? (o.paused ? "Paused" : "On") : "Off (COMMUNITY_FUND_ENABLED=false)")))),
    h("div", { class: "copy-row mt16" },
      h("button", { class: "btn btn-ghost btn-sm", disabled: !isOp, title: isOp ? "" : "Sign in with the operator wallet", onclick: run("/api/admin/community/ops/claim") }, "1. Claim creator rewards"),
      h("button", { class: "btn btn-primary btn-sm", disabled: !isOp, title: isOp ? "" : "Sign in with the operator wallet", onclick: run("/api/admin/community/ops/sweep") }, `2. Move ${o.bps / 100}% to the fund`),
      h("button", { class: "btn btn-primary btn-sm", disabled: !isTr || !o.enabled, title: isTr ? "" : "Sign in with the treasury wallet", onclick: run("/api/admin/community/ops/payout") }, "3. Pay players")),
    status,
    h("h3", { class: "mt16" }, "Recent fund transactions"),
    h("table", { class: "simple" }, h("tbody", {}, o.ops.map((x) => h("tr", {}, h("td", {}, x.kind), h("td", {}, SOL(x.lamports)), h("td", {}, x.status),
      h("td", {}, x.signature ? h("a", { href: `https://solscan.io/tx/${x.signature}`, target: "_blank", rel: "noopener" }, `${x.signature.slice(0, 8)}…`) : x.error || ""))))));
}
function show(rows) { $("#dump").textContent = JSON.stringify(rows, null, 2); }

function signInBlock(purpose) {
  const box = h("div", { class: "wallet-list mt16" });
  for (const w of listWallets()) box.append(h("button", { onclick: async () => { try { await signInWith(w, { purpose }); await load(); } catch (e) { msg.textContent = e.message; } } }, w.name, purpose === "reauth" ? " · confirm with a fresh signature" : " · sign in"));
  if (!box.childNodes.length) box.append(h("p", {}, "No Solana wallet detected."));
  return box;
}

load();
