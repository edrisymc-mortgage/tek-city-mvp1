// TEK CITY play client. Renders server state and sends intents. It never computes outcomes.
import { io } from "socket.io-client";
import { renderIcons } from "./lib/icons.js";
import { api, ApiError } from "./lib/api.js";
import { h, icon, $, $$, clear, avatar, fmtTime } from "./lib/dom.js";
const add = (el, ...nodes) => el.append(...nodes.flat().filter((n) => n !== null && n !== undefined && n !== false));
import { listWallets, onWalletsChanged, signInWith, disconnect, isMobile, phantomBrowseLink } from "./lib/wallet.js";

const S = { city: null, me: { signedIn: false }, config: null, lb: "today", drawer: null, busy: false, wallet: null, lastRound: null };
const HOOD_ICON = { harbor: "anchor", brick: "factory", greenway: "trees", gilded: "store", signal: "radio", heights: "cpu" };
const STOP_ICON = { station: "train-front", vault: "vault", desk: "newspaper", workshop: "wrench", plaza: "megaphone" };

// ------------------------------------------------------------------ helpers
function toast(msg, kind = "ok", opts = {}) {
  const el = h("div", { class: `toast ${kind}` },
    opts.dice ? h("span", { class: "dice" }, String(opts.dice)) : icon(kind === "err" ? "triangle-alert" : kind === "gold" ? "sparkles" : kind === "info" ? "info" : "circle-check"),
    h("div", {}, msg));
  $("#toasts").append(el);
  renderIcons(el);
  setTimeout(() => el.remove(), opts.ms || 4800);
}
const fmt = (n) => Number(n || 0).toLocaleString();
const pct = (a, b) => `${Math.max(0, Math.min(100, b ? (a / b) * 100 : 0))}%`;
const bar = (w, cls = "") => h("div", { class: `bar ${cls}` }, h("i", { style: { width: w } }));
const district = (id) => S.city && S.city.districts.find((d) => d.id === id);
const stop = (id) => S.city && S.city.stops[id];

// ------------------------------------------------------------------ data
async function refreshCity() { S.city = await api.get("/api/state"); }
async function refreshMe() { S.me = await api.get("/api/me"); }
async function refreshAll() {
  try { await Promise.all([refreshCity(), S.me.signedIn ? refreshMe() : Promise.resolve()]); render(); }
  catch { /* transient */ }
}
let pending = null;
function scheduleRefresh(delay = 250) { clearTimeout(pending); pending = setTimeout(refreshAll, delay); }

// ------------------------------------------------------------------ render
function render() {
  if (!S.city) return;
  renderTop(); renderAccount(); renderPlayer(); renderBoard(); renderEvent(); renderGoal(); renderVault(); renderLB(); renderMoods(); renderFeed(); renderMobile();
  if (S.drawer !== null) renderDrawer();
  renderIcons();
}

function renderTop() {
  const c = S.city;
  $("#round-no").textContent = c.round ? `${c.round.number} / 96` : "--";
  $("#day-label").textContent = c.day;
  const p = $("#paused");
  p.classList.toggle("show", !!c.paused);
  p.textContent = c.paused ? `City paused: ${c.pausedReason}. Your progress is safe.` : "";
  if (S.lastRound && c.round && S.lastRound !== c.round.key) toast(`Round ${c.round.number} is open. Energy refilled.`, "info");
  S.lastRound = c.round && c.round.key;
}

function renderAccount() {
  const slot = clear($("#account-slot"));
  if (S.me.signedIn) {
    const u = S.me.user;
    add(slot, h("button", { class: "profile-chip", onclick: openProfile, "aria-label": "Your profile" },
      avatar(u.name, u.seed), h("span", {}, u.name), u.wallet ? h("span", { class: "verified", title: `Verified wallet ${u.wallet.short}` }, icon("badge-check")) : null));
  } else {
    add(slot, 
      h("button", { class: "btn btn-cream btn-sm", onclick: () => openSignIn() }, icon("play"), "Play as guest"),
      walletEnabled() ? h("button", { class: "btn btn-ghost btn-sm", onclick: () => openSignIn(true) }, icon("wallet"), "Connect wallet") : null,
    );
  }
}

function walletEnabled() { return !!(S.config && S.config.features.walletConnect); }

function actionButton({ id, ic, title, sub, cost, reason, onclick, primary }) {
  return h("button", { class: `action ${primary ? "primary" : ""}`, disabled: !!reason || S.busy, onclick, "data-act": id, title: reason || "" },
    h("span", { class: "ic" }, icon(ic)),
    h("span", {}, h("b", {}, title), h("small", {}, reason || sub)),
    cost ? h("span", { class: "cost" }, cost) : h("span"));
}

function renderPlayer() {
  const el = clear($("#player"));
  if (!S.me.signedIn) {
    add(el, h("div", { class: "signin" },
      h("p", {}, "Join the city to check in, ride the Transit Line, and build districts with everyone else."),
      h("button", { class: "btn btn-primary", onclick: () => openSignIn() }, icon("play"), "Play as guest"),
      walletEnabled() ? h("button", { class: "btn btn-ghost", onclick: () => openSignIn(true) }, icon("wallet"), "Sign in with wallet") : null,
      h("p", { class: "muted" }, "Wallets are optional and only used for identity. TEK CITY never asks for your seed phrase or private key.")));
    return;
  }
  const m = S.me, r = m.resources, here = stop(m.position);
  add(el, 
    h("div", { class: "res" },
      h("div", { class: "energy" }, h("span", { class: "k" }, icon("zap"), "Energy"), h("div", { class: "v" }, `${r.energy}`, h("small", { class: "muted" }, `/${r.maxEnergy}`))),
      h("div", { class: "credits" }, h("span", { class: "k" }, icon("coins"), "Credits"), h("div", { class: "v" }, fmt(r.build_credits))),
      h("div", { class: "influence" }, h("span", { class: "k" }, icon("star"), "Influence"), h("div", { class: "v" }, fmt(r.influence_today)))),
    h("div", { class: "energy-bar" }, bar(pct(r.energy, r.maxEnergy))),
    h("div", { class: "actions" },
      actionButton({ id: "checkin", ic: "circle-check", title: "Check in", sub: "Collect Build Credits, +1 Energy, +1 Influence", reason: m.can.checkin, onclick: () => act("checkin"), primary: !m.can.checkin }),
      actionButton({ id: "move", ic: "train-front", title: "Ride the Transit Line", sub: "Server rolls 1 to 6. Land on a district to build on site.", cost: "2 ⚡", reason: m.can.move, onclick: () => act("move") }),
      actionButton({ id: "contribute", ic: "hammer", title: "Contribute", sub: `${m.contributionsLeft} of ${S.city.rules.contributionsPerRound} left this round. Tap a district.`, cost: "1 ⚡", reason: m.can.contribute, onclick: () => openDrawer(here && here.type === "district" ? here.id : firstOpenDistrict()) })),
    h("div", { class: "here" }, h("span", { class: "muted" }, "You're at"), h("b", {}, here ? here.name : "--"),
      m.onSite !== null ? h("span", {}, "On site: contributions here earn 1.5x District XP this round.") : h("span", { class: "muted" }, here && here.text ? here.text : "Ride the line to reach a district.")),
    m.badges.length ? h("div", { class: "badges" }, m.badges.map((b) => h("span", { title: b.description }, b.name))) : null,
    h("div", { class: "mt12" }, h("button", { class: "btn btn-ghost btn-sm", onclick: () => openTutorial(0) }, icon("circle-help"), "How to play")));
}

function firstOpenDistrict() { const d = S.city.districts.find((x) => x.next); return d ? d.id : 1; }

const MOBILE = window.matchMedia("(max-width: 900px)");
MOBILE.addEventListener("change", () => render());
function renderEvent() {
  const other = MOBILE.matches ? $("#event") : $("#event-m");
  if (other) clear(other);
  const el = clear(MOBILE.matches ? $("#event-m") : $("#event"));
  const e = S.city.event;
  if (!e) return;
  if (e.kind === "crisis") {
    const d = district(e.target);
    add(el, h("div", { class: "event crisis" },
      h("div", { class: "eic" }, icon("siren")),
      h("div", {},
        h("span", { class: "tag" }, `City crisis · Severity ${e.severity}`),
        h("h2", {}, e.title.split(" ·")[0]),
        h("p", {}, e.body),
        h("div", { class: "crisis-meter" }, bar(pct(e.progress, e.requirement)), h("span", { class: "mono" }, `${fmt(e.progress)} / ${fmt(e.requirement)} District XP at ${d ? d.name : "?"}`)),
        h("div", { class: "mt12" }, h("button", { class: "btn btn-red btn-sm", onclick: () => openDrawer(e.target), disabled: !S.me.signedIn }, icon("hammer"), `Help ${d ? d.name : ""}`)))));
    return;
  }
  const reason = S.me.signedIn ? S.me.can.vote : "Join the city to vote.";
  const total = (e.tally || []).reduce((a, b) => a + b, 0);
  add(el, h("div", { class: "event" },
    h("div", { class: "eic" }, icon("gavel")),
    h("div", {},
      h("span", { class: "tag" }, "City Brief · decided at the tick"),
      h("h2", {}, e.title), h("p", {}, e.body),
      h("div", { class: "options" }, e.options.map((o, i) => h("button", { class: "opt", disabled: !!reason || S.busy, onclick: () => act("vote", { option: i }), title: reason || "" },
        h("b", {}, o.label), h("small", {}, o.hint || ""), h("span", { class: "votes" }, `${e.tally ? e.tally[i] : 0} vote${e.tally && e.tally[i] === 1 ? "" : "s"}${total ? ` · ${Math.round(((e.tally[i] || 0) / total) * 100)}%` : ""}`)))),
      reason && S.me.signedIn ? h("p", { class: "mt12 small" }, reason) : null)));
}

// 7x7 loop board: 24 spaces around the edge, city center in the middle.
// Stop 0 (Central Station) is the bottom-right corner; play runs clockwise: bottom row right->left, up the left side, across the top, down the right side.
function gridPos(i) {
  if (i <= 6) return { row: 7, col: 7 - i, side: "bottom" };
  if (i <= 12) return { row: 7 - (i - 6), col: 1, side: "left" };
  if (i <= 18) return { row: 1, col: 1 + (i - 12), side: "top" };
  return { row: 1 + (i - 18), col: 7, side: "right" };
}
const CORNERS = new Set([0, 6, 12, 18]);

function renderBoard() {
  const board = clear($("#board"));
  const c = S.city;
  const byPos = new Map();
  for (const p of c.players) { if (!byPos.has(p.position)) byPos.set(p.position, []); byPos.get(p.position).push(p); }
  const myPos = S.me.signedIn ? S.me.position : null;
  const target = c.event && c.event.kind === "crisis" ? c.event.target : null;
  for (const s of c.stops) {
    const g = gridPos(s.id);
    const d = district(s.id);
    const hood = s.hood ? c.neighborhoods[s.hood] : null;
    const cls = ["space", `side-${g.side}`, CORNERS.has(s.id) ? "corner" : "", d ? "prop" : `special ${s.type}`, s.id === target ? "target" : "", s.id === myPos ? "mine" : "", d && !d.next ? "complete" : ""].join(" ");
    const players = (byPos.get(s.id) || []).filter((p) => !(S.me.signedIn && p.name === S.me.user.name));
    const tile = h("button", {
      class: cls, "data-stop": s.id, style: { "grid-row": g.row, "grid-column": g.col, ...(hood ? { "--hc": hood.color } : {}) },
      onclick: () => openDrawer(s.id), "aria-label": `${s.name}${d ? `, Level ${d.level}` : ""}`,
    },
      d ? h("span", { class: "band" }, h("span", { class: "floors" }, [1, 2, 3, 4, 5].map((n) => h("i", { class: n <= d.level ? "on" : "" })))) : null,
      h("span", { class: "nm" }, s.name),
      d ? h("span", { class: "lvl" }, `LV ${d.level}`) : h("span", { class: "sic" }, icon(STOP_ICON[s.type] || "map-pin")),
      d ? h("span", { class: "xp" }, h("i", { style: { width: d.next ? pct(d.xp, d.next) : "100%" } })) : h("span", { class: "sub" }, s.type === "desk" ? "Dispatch" : s.type === "station" ? "GO · +25" : s.type === "vault" ? "Vault" : s.type === "workshop" ? "+20 · +1⚡" : "+5 Inf"),
      h("span", { class: "tokens" }, players.slice(0, 4).map((p) => avatar(p.name, p.seed)), players.length > 4 ? h("span", { class: "more" }, `+${players.length - 4}`) : null));
    add(board, tile);
  }
  // City center
  const center = h("div", { class: "center" },
    h("div", { class: "center-top" },
      h("div", { class: "brand" }, h("span", { class: "kick" }, "Community board"), h("b", {}, "TEK CITY")),
      h("div", { class: "dice-box" },
        h("div", { class: "die", id: "die" }, pips(S.lastRoll || 0)),
        h("button", { class: "btn btn-primary roll", id: "roll-btn", disabled: !S.me.signedIn || !!S.me.can.move || S.busy, onclick: () => act("move"), title: S.me.signedIn ? (S.me.can.move || "") : "Join to roll" }, icon("dice-5"), "Roll"),
        h("small", { class: "roll-why" }, !S.me.signedIn ? "Join the city to roll" : S.me.can.move || "Costs 2 Energy · once per round"))),
    h("div", { id: "event" }));
  add(board, center);
  // my token (animated separately)
  if (S.me.signedIn) add(board, h("span", { class: "my-token", id: "my-token" }, avatar(S.me.user.name, S.me.user.seed, "me")));
  requestAnimationFrame(() => placeToken(myPos, false));
  const legend = clear($("#legend"));
  for (const [k, n] of Object.entries(c.neighborhoods)) add(legend, h("span", { style: { "--hc": n.color } }, h("i"), `${n.name} · ${n.levels} lv`));
}

function pips(n) {
  const layout = { 0: [], 1: [5], 2: [1, 9], 3: [1, 5, 9], 4: [1, 3, 7, 9], 5: [1, 3, 5, 7, 9], 6: [1, 3, 4, 6, 7, 9] }[n] || [];
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => h("i", { class: layout.includes(k) ? "on" : "" }));
}

function placeToken(pos, animate = true) {
  const tok = $("#my-token"); const board = $("#board");
  if (!tok || pos === null || pos === undefined) return;
  const t = $(`.space[data-stop="${pos}"]`, board); if (!t) return;
  const br = board.getBoundingClientRect(), r = t.getBoundingClientRect();
  tok.style.transition = animate ? "transform 170ms ease-out" : "none";
  tok.style.transform = `translate(${r.left - br.left + r.width / 2 - 14}px, ${r.top - br.top + r.height / 2 - 6}px)`;
}
window.addEventListener("resize", () => requestAnimationFrame(() => placeToken(S.me.signedIn ? S.me.position : null, false)));

function renderGoal() {
  const g = S.city.goal, c = S.city;
  const el = clear($("#goal"));
  add(el, 
    h("div", { class: `stab ${c.stability <= 30 ? "low" : ""}` }, h("div", { class: "k" }, "Stability"), h("div", { class: "v" }, `${c.stability}%`), bar(`${c.stability}%`)),
    h("div", { class: "lv" }, h("div", { class: "k" }, "District levels"), h("div", { class: "v" }, `${g.levels} / ${g.levelsNeeded}`), bar(pct(g.levels, g.levelsNeeded))),
    h("div", { class: "vm" }, h("div", { class: "k" }, "Vault milestones"), h("div", { class: "v" }, `${g.milestones} / ${g.milestonesNeeded}`), bar(pct(g.milestones, g.milestonesNeeded))));
  const ban = $("#day-banner");
  ban.className = "day-banner";
  if (c.dayStatus === "thrived") { ban.classList.add("show", "thrived"); ban.textContent = "TEK CITY THRIVES today. Goal complete: everyone who played earned the City Thrives badge. Keep building for the leaderboard."; }
  else if (c.dayStatus === "blackout") { ban.classList.add("show", "blackout"); ban.textContent = c.recovery ? `Blackout. Today's goal is lost. Recovery until round ${c.recovery}: contributions earn half XP.` : "Blackout. Today's goal is lost, but the city is back online. Build for tomorrow."; }
  $("#day-status").textContent = c.dayStatus === "active" ? "in progress" : c.dayStatus;
  const mini = clear($("#goal-mini"));
  add(mini, h("p", {}, `Reach ${g.levelsNeeded} district levels and ${g.milestonesNeeded} Vault milestones before midnight UTC. Keep Stability above zero.`),
    h("p", { class: "mb0" }, `Resets at 00:00 UTC. ${96 - (c.round ? c.round.number : 0)} rounds left today.`));
}

function renderVault() {
  const v = S.city.vault;
  const within = v.progress - v.milestone * v.milestoneSize;
  const frac = Math.max(0, Math.min(1, within / v.milestoneSize));
  const C = 2 * Math.PI * 50;
  const el = clear($("#vault"));
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg"); svg.setAttribute("viewBox", "0 0 120 120");
  const trk = document.createElementNS(ns, "circle"); trk.setAttribute("class", "trk"); trk.setAttribute("cx", 60); trk.setAttribute("cy", 60); trk.setAttribute("r", 50);
  const val = document.createElementNS(ns, "circle"); val.setAttribute("class", "val"); val.setAttribute("cx", 60); val.setAttribute("cy", 60); val.setAttribute("r", 50);
  val.setAttribute("stroke-dasharray", C.toFixed(1)); val.setAttribute("stroke-dashoffset", (C * (1 - frac)).toFixed(1));
  svg.append(trk, val);
  add(el, h("div", { class: "vault-meter" }, svg, h("div", { class: "center" }, h("b", {}, `${Math.round(frac * 100)}%`), h("small", {}, `${within} / ${v.milestoneSize}`))),
    h("p", { class: "vault-info" }, "20% of every contribution fills the Vault. Each milestone unlocks a city-wide build boost and the Vault Keeper badge for active builders."),
    S.city.boosts.length ? h("div", { class: "boosts" }, S.city.boosts.map((b) => h("span", {}, icon("sparkles"), b))) : null);
  $("#vault-ms").textContent = `Milestone ${v.milestone}`;
}

function renderLB() {
  const rows = S.city.leaderboard[S.lb];
  const el = clear($("#lb"));
  if (!rows.length) { add(el, h("li", { class: "empty" }, "No Influence earned yet. Be the first.")); return; }
  rows.forEach((r, i) => add(el, h("li", { class: S.me.signedIn && r.name === S.me.user.name ? "me" : "" },
    h("span", { class: "rk" }, `${i + 1}`), h("span", {}, r.name, r.kind === "wallet" ? " ✓" : ""), h("span", { class: "pts" }, fmt(r.influence)))));
  $$(".tabs button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.lb === S.lb)));
}

function renderMoods() {
  const el = clear($("#moods"));
  for (const m of Object.values(S.city.moods)) {
    const state = m.value >= 70 ? "hi" : m.value <= 30 ? "lo" : "";
    add(el, h("div", { class: `mood ${state}` },
      h("div", { class: "row" }, h("span", {}, m.name), h("span", { class: "mono" }, `${m.value}`)), bar(`${m.value}%`),
      h("small", {}, state === "hi" ? `Happy: ${m.high}` : state === "lo" ? `Unhappy: ${m.low}` : `Neutral. Over 70: ${m.high.toLowerCase()}.`)));
  }
}

function renderFeed() {
  const el = clear($("#feed"));
  for (const a of S.city.activity) add(el, h("li", { class: a.kind }, h("time", {}, fmtTime(a.at)), h("span", {}, a.text)));
}

function renderMobile() {
  const el = clear($("#mobile-bar"));
  if (!S.me.signedIn) {
    add(el, h("button", { onclick: () => openSignIn(), style: { "grid-column": "1 / -1" } }, icon("play"), "Join the city", h("small", {}, "Guest or wallet")));
    return;
  }
  const m = S.me, here = stop(m.position);
  const b = (ic, label, reason, fn, sub) => h("button", { disabled: !!reason || S.busy, onclick: fn }, icon(ic), label, h("small", {}, reason || sub));
  add(el, 
    b("circle-check", "Check in", m.can.checkin, () => act("checkin"), "+Credits"),
    b("train-front", "Ride", m.can.move, () => act("move"), "2 Energy"),
    b("hammer", "Build", m.can.contribute, () => openDrawer(here && here.type === "district" ? here.id : firstOpenDistrict()), `${m.contributionsLeft} left`),
    S.city.event && S.city.event.kind === "crisis"
      ? b("siren", "Crisis", null, () => openDrawer(S.city.event.target), "Help now")
      : b("gavel", "Vote", m.can.vote, () => $("#event").scrollIntoView({ behavior: "smooth", block: "center" }), "City Brief"));
}

// ------------------------------------------------------------------ drawer
function openDrawer(id) {
  S.drawer = id;
  renderDrawer();
  $("#drawer").classList.add("open"); $("#scrim").classList.add("open");
  $("#drawer").setAttribute("aria-hidden", "false");
  renderIcons($("#drawer"));
  const btn = $("#drawer .close"); if (btn) btn.focus();
}
function closeDrawer() {
  S.drawer = null;
  $("#drawer").classList.remove("open"); $("#scrim").classList.remove("open"); $("#drawer").setAttribute("aria-hidden", "true");
}
let amount = 50;
function renderDrawer() {
  const dr = clear($("#drawer"));
  const s = stop(S.drawer); if (!s) return;
  const d = district(s.id);
  const hood = s.hood ? S.city.neighborhoods[s.hood] : null;
  if (hood) dr.style.setProperty("--hc", hood.color); else dr.style.setProperty("--hc", "#e2b33c");
  const header = h("header", {}, h("span", { class: "band" }),
    h("span", { class: "kicker" }, hood ? hood.name : "Transit stop"), h("h2", { id: "dr-title" }, s.name),
    h("span", { class: "muted ink2 small" }, d ? `Stop ${s.id} · Level ${d.level} of 5` : `Stop ${s.id}`),
    h("button", { class: "close", onclick: closeDrawer, "aria-label": "Close" }, icon("x")));
  const body = h("div", { class: "body" });
  add(dr, header, body);
  if (!d) {
    add(body, h("p", {}, s.text || ""), h("p", { class: "small ink2" }, "Special stops trigger when you land on them after riding the Transit Line. The server decides the roll."));
    renderIcons(dr);
    return;
  }
  const m = S.me;
  const crisis = S.city.event && S.city.event.kind === "crisis" && S.city.event.target === d.id ? S.city.event : null;
  add(body, 
    h("div", { class: "kv" },
      h("div", {}, h("div", { class: "k" }, "Level"), h("div", { class: "v" }, `${d.level} / 5`)),
      h("div", {}, h("div", { class: "k" }, "District XP"), h("div", { class: "v" }, d.next ? `${fmt(d.xp)} / ${fmt(d.next)}` : "Complete"))),
    h("div", { class: "xpbar" }, bar(d.next ? pct(d.xp, d.next) : "100%")),
    h("div", { class: "effect" }, h("b", {}, `${hood.name} effect: `), hood.effect),
    crisis ? h("div", { class: "reason" }, icon("siren"), `Crisis here: ${fmt(crisis.progress)} / ${fmt(crisis.requirement)} XP needed before the tick.`) : null);
  if (!d.next) { add(body, h("p", {}, "This district is fully built for today. Help another district level up.")); renderIcons(dr); return; }
  if (!m.signedIn) { add(body, h("button", { class: "btn btn-primary", onclick: () => { closeDrawer(); openSignIn(); } }, icon("play"), "Join to contribute")); renderIcons(dr); return; }
  const max = Math.max(S.city.rules.minContribution, Math.min(S.city.rules.maxContribution, Math.floor(m.resources.build_credits / 5) * 5));
  amount = Math.max(S.city.rules.minContribution, Math.min(amount, max));
  const onSite = m.onSite === d.id;
  const out = h("output", {}, String(amount));
  const preview = h("p", { class: "preview" });
  const updatePreview = () => {
    out.textContent = String(amount);
    preview.textContent = `About +${Math.round(amount * (onSite ? 1.5 : 1))} District XP${onSite ? " (on-site 1.5x)" : ""}, +${Math.floor(amount / 10)} Influence, +${Math.floor(amount * 0.2)} Vault progress. Costs 1 Energy. Final XP is calculated by the server (citizen moods and boosts apply).`;
  };
  const step = (dlt) => { amount = Math.max(S.city.rules.minContribution, Math.min(max, amount + dlt)); updatePreview(); };
  updatePreview();
  const reason = m.can.contribute || (m.resources.build_credits < S.city.rules.minContribution ? "Not enough Build Credits." : null);
  add(body, 
    h("div", {}, h("div", { class: "k small ink2" }, "Contribution (Build Credits)"),
      h("div", { class: "amount" }, h("button", { onclick: () => step(-5), "aria-label": "Less" }, "−"), out, h("button", { onclick: () => step(5), "aria-label": "More" }, "+"))),
    h("div", { class: "presets" }, [25, 50, 100, 200].filter((v) => v <= max).map((v) => h("button", { onclick: () => { amount = v; updatePreview(); } }, String(v))), h("button", { onclick: () => { amount = max; updatePreview(); } }, `Max ${max}`)),
    preview,
    reason ? h("div", { class: "reason" }, icon("info"), reason) : null,
    h("button", { class: "btn btn-primary", disabled: !!reason || S.busy, onclick: () => act("contribute", { districtId: d.id, amount }) }, icon("hammer"), `Contribute ${amount}`),
    h("p", { class: "small ink2" }, onSite ? "You're on site this round." : "Tip: land on this district with the Transit Line first to earn 1.5x XP."));
  renderIcons(dr);
}
$("#scrim").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDrawer(); closeModal(); } });

// ------------------------------------------------------------------ actions
async function act(type, body = {}) {
  if (S.busy) return;
  S.busy = true; renderPlayer(); renderMobile(); renderIcons();
  try {
    const r = await api.action(type, body);
    if (type === "move") {
      await animatePath(r.path, r.roll);
      toast(r.message, "ok", { dice: r.roll, ms: 6000 });
    } else if (type === "contribute") {
      toast(r.message, "gold");
      if (r.firstBadge) toast("Badge earned: First Brick", "gold");
      closeDrawer();
    } else toast(r.message);
  } catch (e) {
    toast(e.message, "err");
    if (e instanceof ApiError && e.code === "sign_in_required") { S.me = { signedIn: false }; openSignIn(); }
  } finally {
    S.busy = false;
    await refreshAll();
  }
}
async function animatePath(path = [], roll) {
  const die = $("#die");
  if (die) {
    die.classList.add("rolling");
    for (let i = 0; i < 8; i++) { clear(die); add(die, pips(1 + Math.floor(Math.random() * 6))); await new Promise((r) => setTimeout(r, 70)); }
    die.classList.remove("rolling"); clear(die); add(die, pips(roll));
  }
  S.lastRoll = roll;
  for (const id of path) {
    placeToken(id, true);
    const t = $(`.space[data-stop="${id}"]`);
    if (t) { t.classList.remove("hop"); void t.offsetWidth; t.classList.add("hop"); }
    await new Promise((r) => setTimeout(r, 230));
  }
}

// ------------------------------------------------------------------ modals
function openModal(nodes) { const b = clear($("#modal-box")); b.append(...nodes); $("#modal").classList.add("open"); renderIcons(b); const f = b.querySelector("input,button"); if (f) f.focus(); }
function closeModal() { $("#modal").classList.remove("open"); }
$("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });

function safetyNote() {
  return h("div", { class: "note" }, icon("shield-check"), h("span", {}, "Signing in only signs a text message. It is not a transaction, costs nothing, and gives no access to funds. TEK CITY never asks for your seed phrase or private key."));
}

function openSignIn(walletFirst = false) {
  const status = h("p", { class: "small", role: "status" });
  const name = h("input", { id: "guest-name", maxlength: 20, minlength: 2, placeholder: "Builder name", autocomplete: "nickname", value: "" });
  const startGuest = async () => {
    const v = name.value.trim();
    if (!/^[A-Za-z0-9][A-Za-z0-9 _.-]{1,19}$/.test(v)) { status.textContent = "Use 2 to 20 letters, numbers, spaces, dots, dashes or underscores."; return; }
    status.textContent = "Joining…";
    try { const r = await api.post("/api/guest", { name: v }); S.me = r.me; closeModal(); await refreshAll(); toast(`Welcome to TEK CITY, ${v}.`); maybeTutorial(); }
    catch (e) { status.textContent = e.message; }
  };
  name.addEventListener("keydown", (e) => { if (e.key === "Enter") startGuest(); });
  const guest = h("div", {}, h("h2", {}, "Join the city"), h("p", { class: "ink2" }, "Play instantly as a guest. You can link a wallet later to keep a verified identity."),
    name, h("div", { class: "row" }, h("button", { class: "btn btn-primary", onclick: startGuest }, icon("play"), "Play as guest")));
  const wallets = walletEnabled() ? walletSection(status) : h("p", { class: "small ink2 mt16" }, "Wallet sign-in is turned off right now.");
  openModal(walletFirst ? [wallets, h("hr", { class: "mt16" }), guest, status] : [guest, wallets, status]);
}

function walletSection(status, { purpose = "login", title = "Or sign in with a Solana wallet" } = {}) {
  const list = h("div", { class: "wallet-list" });
  const fill = () => {
    clear(list);
    const ws = listWallets();
    for (const w of ws) {
      add(list, h("button", { onclick: () => doWallet(w, status, purpose) }, w.icon ? h("img", { src: w.icon, alt: "" }) : icon("wallet"), w.name, h("span", { class: "muted small" }, " · signature only")));
    }
    if (!ws.length) {
      if (isMobile()) add(list, h("a", { class: "btn btn-cream", href: phantomBrowseLink(), rel: "noopener" }, icon("wallet"), "Open TEK CITY in the Phantom app"));
      else add(list, h("p", { class: "small ink2" }, "No Solana wallet detected in this browser. Install a wallet extension such as Phantom from its official site, then reload this page."));
    }
    renderIcons(list);
  };
  fill();
  onWalletsChanged(fill);
  return h("div", { class: "mt16" }, h("h3", {}, title), list, safetyNote());
}

async function doWallet(w, status, purpose) {
  status.textContent = "Check your wallet. You'll be asked to sign a sign-in message (not a transaction).";
  try {
    const r = await signInWith(w, { purpose });
    S.wallet = w;
    S.me = r.me;
    closeModal();
    await refreshAll();
    toast(purpose === "reauth" ? "Confirmed." : `Signed in as ${r.me.user.name}. Wallet verified.`);
    maybeTutorial();
  } catch (e) {
    status.textContent = e && /reject|denied|cancel/i.test(String(e.message)) ? "Request cancelled in your wallet. Nothing was signed." : (e.message || "Wallet sign-in failed.");
  }
}

function openProfile() {
  const m = S.me, u = m.user;
  const status = h("p", { class: "small", role: "status" });
  const name = h("input", { maxlength: 20, value: u.name });
  const save = async () => { try { const r = await api.post("/api/profile", { name: name.value.trim() }); S.me = r.me; status.textContent = "Saved."; await refreshAll(); } catch (e) { status.textContent = e.message; } };
  const signOut = async () => { try { await api.post("/api/auth/logout", {}); await disconnect(S.wallet); S.me = { signedIn: false }; closeModal(); await refreshAll(); toast("Signed out.", "info"); } catch (e) { status.textContent = e.message; } };
  openModal([
    h("h2", {}, "Your builder"),
    h("p", { class: "ink2" }, u.wallet ? `Verified wallet ${u.wallet.short} (signature only, ${S.config ? S.config.solanaNetwork : "devnet"}).` : "Guest account. Link a wallet to keep a verified identity across devices."),
    h("label", { class: "small ink2" }, "Display name"), name,
    h("div", { class: "row" }, h("button", { class: "btn btn-ghost", onclick: save }, "Save name")),
    h("h3", { class: "mt16" }, "Badges"),
    m.badges.length ? h("ul", {}, m.badges.map((b) => h("li", {}, h("b", {}, b.name), ` · ${b.description}`))) : h("p", { class: "small ink2" }, "No badges yet. Contribute to a district to earn First Brick."),
    !u.wallet && walletEnabled() ? walletSection(status, { title: "Link a wallet" }) : null,
    status,
    h("div", { class: "row" }, h("button", { class: "btn btn-ghost", onclick: closeModal }, "Close"), h("button", { class: "btn btn-red", onclick: signOut }, icon("log-out"), "Sign out")),
  ].filter(Boolean));
}

// ------------------------------------------------------------------ tutorial
const TUT = [
  { ic: "landmark", t: "Welcome to TEK CITY", b: "Everyone on the server shares one city. Your goal today: help reach 36 district levels and 3 Community Vault milestones before midnight UTC, and keep Stability above zero." },
  { ic: "clock", t: "Every 15 minutes, the board evolves", b: "A round lasts exactly 15 minutes. At the tick the server settles everything: votes, crises, district upgrades, the Vault, and the leaderboard. Then Energy refills and a new round opens." },
  { ic: "train-front", t: "Check in and ride", b: "Check in once per round for Build Credits. Ride the Transit Line for 2 Energy: the server rolls 1 to 6. Landing on a district puts you on site for 1.5x build XP." },
  { ic: "hammer", t: "Build together", b: "Tap any district to contribute Build Credits (up to 3 times per round). When it levels up, everyone who helped earns Influence and a badge. 20% of each contribution fills the Community Vault." },
  { ic: "gavel", t: "Briefs, crises, and citizens", b: "Vote on City Briefs to steer Makers, Merchants, and Residents. Crises target one district: hit the XP target or the city loses Stability. Nobody can take your resources." },
];
let tutStep = 0;
function openTutorial(i = 0) {
  tutStep = i;
  const s = TUT[i];
  openModal([
    h("div", { class: "tut-steps" }, TUT.map((_, j) => h("i", { class: j <= i ? "on" : "" }))),
    h("div", { class: "tut-ic" }, icon(s.ic)), h("h2", {}, s.t), h("p", { class: "ink2" }, s.b),
    h("div", { class: "row" },
      h("button", { class: "btn btn-ghost", onclick: finishTutorial }, "Skip"),
      i > 0 ? h("button", { class: "btn btn-ghost", onclick: () => openTutorial(i - 1) }, "Back") : null,
      h("button", { class: "btn btn-primary", onclick: () => (i < TUT.length - 1 ? openTutorial(i + 1) : finishTutorial()) }, i < TUT.length - 1 ? "Next" : "Start building")),
  ].filter(Boolean));
}
async function finishTutorial() {
  closeModal();
  try { localStorage.setItem("tc_tut", "1"); } catch { /* private mode */ }
  if (S.me.signedIn && !S.me.tutorialDone) { try { await api.post("/api/tutorial", { done: true }); S.me.tutorialDone = true; } catch { /* ignore */ } }
}
function maybeTutorial() { let seen = false; try { seen = localStorage.getItem("tc_tut") === "1"; } catch { /* ignore */ } if (S.me.signedIn && !S.me.tutorialDone && !seen) openTutorial(0); }

// ------------------------------------------------------------------ clock + live updates
function tickClock() {
  const c = S.city; if (!c || !c.round) return;
  const ms = new Date(c.round.endsAt) - Date.now();
  const box = $("#countdown-box");
  if (ms <= 0) { $("#countdown").textContent = "settling"; box.classList.add("urgent"); if (!tickClock.wait) { tickClock.wait = true; setTimeout(async () => { tickClock.wait = false; await refreshAll(); }, 4000); } return; }
  const m = Math.floor(ms / 60000), s = Math.floor(ms / 1000) % 60;
  $("#countdown").textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  box.classList.toggle("urgent", ms < 60000);
}

function connectLive() {
  const socket = io({ transports: ["websocket", "polling"], withCredentials: true });
  let ver = -1;
  socket.on("city", (m) => { if (m.version !== ver) { ver = m.version; scheduleRefresh(); } });
  socket.on("connect", () => { $("#live-dot").textContent = "live"; });
  socket.on("disconnect", () => { $("#live-dot").textContent = "reconnecting"; });
}

$$(".tabs button").forEach((b) => b.addEventListener("click", () => { S.lb = b.dataset.lb; renderLB(); }));

(async function init() {
  renderIcons();
  try {
    const [sess, config] = await Promise.all([api.session(), api.get("/api/config")]);
    S.me = sess.me; S.config = config;
    await refreshCity();
    render();
    if (!S.me.signedIn) openSignIn(location.hash === "#wallet");
    else maybeTutorial();
  } catch (e) {
    toast(e.message || "Couldn't reach the city. Retrying…", "err");
    setTimeout(init, 5000);
    return;
  }
  setInterval(tickClock, 1000); tickClock();
  setInterval(refreshAll, 30000);
  connectLive();
})();
