// Operator console. All authority lives on the server; this page just calls admin endpoints.
import "./site.js";
import { api } from "./lib/api.js";
import { h, $, clear } from "./lib/dom.js";
import { listWallets, signInWith } from "./lib/wallet.js";
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
  renderIcons(root);
}
function show(rows) { $("#dump").textContent = JSON.stringify(rows, null, 2); }

function signInBlock(purpose) {
  const box = h("div", { class: "wallet-list mt16" });
  for (const w of listWallets()) box.append(h("button", { onclick: async () => { try { await signInWith(w, { purpose }); await load(); } catch (e) { msg.textContent = e.message; } } }, w.name, purpose === "reauth" ? " · confirm with a fresh signature" : " · sign in"));
  if (!box.childNodes.length) box.append(h("p", {}, "No Solana wallet detected."));
  return box;
}

load();
