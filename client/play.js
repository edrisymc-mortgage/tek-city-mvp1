// TEK CITY play client. Renders server state and sends intents. It never computes outcomes.
import { io } from "socket.io-client";
import { renderIcons } from "./lib/icons.js";
import { api, ApiError } from "./lib/api.js";
import { h, icon, $, $$, clear, avatar, fmtTime } from "./lib/dom.js";
const add = (el, ...nodes) => el.append(...nodes.flat().filter((n) => n !== null && n !== undefined && n !== false));
import { Board3D, webglAvailable, loadFonts } from "./board3d.js";
import { renderPump, renderCoinSection, renderSpins, renderRewards, renderMilestones, renderCoins, spaceName, coinAt, sol } from "./launchpad.js";
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
  renderTop(); renderAccount(); renderPlayer(); renderBoard(); renderSide(); renderFeed(); renderMobile();
  if (S.drawer !== null) renderDrawer();
  renderIcons();
}
function renderSide() {
  renderRewards($("#vault"), S.lpInfo);
  renderMilestones($("#milestones"), S.lpInfo);
  renderCoins($("#coins"), S, LPCTX);
}

function renderTop() {
  const c = S.city;
  const p = $("#paused");
  p.classList.toggle("show", !!c.paused);
  p.textContent = c.paused ? `Board paused: ${c.pausedReason}.` : "";
  const i = S.lpInfo;
  if (i) {
    const m = i.milestones && i.milestones.mcapUsd;
    $("#c-mcap").textContent = m ? `$${Math.round(m).toLocaleString()}` : "Not live";
    $("#c-pool").textContent = `${sol((i.rewards && i.rewards.poolLamports) || 0)} SOL`;
  }
  $("#countdown-box").classList.toggle("lp-hide", !!(c.launchpad && c.launchpad.spins));
}

function renderAccount() {
  const slot = clear($("#account-slot"));
  if (S.me.signedIn) {
    const u = S.me.user;
    const pf = S.pump && S.pump.linked && S.pump.profile;
    add(slot, h("button", { class: "profile-chip", onclick: openProfile, "aria-label": "Your profile" },
      pf && pf.avatar ? h("img", { class: "pf", src: pf.avatar, alt: "" }) : avatar(u.name, u.seed), h("span", {}, (pf && pf.username) || u.name), u.wallet ? h("span", { class: "mono muted small" }, u.wallet.short) : null));
  } else {
    add(slot, 
      walletEnabled() ? h("button", { class: "btn btn-primary btn-sm", onclick: () => openSignIn(true) }, "Connect wallet") : null,
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
      h("p", {}, "You're watching. Connect a Solana wallet to play: spin, launch coins and collect rewards. Use the same wallet you use on pump.fun and your profile links automatically."),
      walletEnabled() ? h("button", { class: "btn btn-primary", onclick: () => openSignIn(true) }, icon("wallet"), "Connect wallet") : null,
      h("p", { class: "small" }, "Connecting signs a message only. It is not a transaction and costs nothing.")));
    return;
  }
  renderSpins(el, S, LPCTX);
  add(el, h("button", { class: "btn btn-ghost btn-sm mt12", onclick: () => openTutorial(0) }, icon("circle-help"), "How it works"));
}

const LP = () => S.city && S.city.launchpad;
const LPCTX = {
  signIn: () => { closeDrawer(); openSignIn(true); },
  linkWallet: () => { closeDrawer(); openSignIn(true); },
  toast: (m, k, o) => toast(m, k, o),
  refresh: () => refreshAll(),
  act: (t, b) => act(t, b),
  openDrawer: (id) => openDrawer(id),
};
async function refreshLaunchpad() {
  try { S.lpInfo = await api.get("/api/launchpad/info"); if (S.b3 && S.b3.setPool) S.b3.setPool(Number(S.lpInfo.rewards && S.lpInfo.rewards.poolLamports) || 0); if (S.city) { renderTop(); renderSide(); renderIcons(); } } catch { /* ignore */ }
}
setInterval(refreshLaunchpad, 60e3);

const MOBILE = window.matchMedia("(max-width: 900px)");
MOBILE.addEventListener("change", () => render());

// 7x7 loop board: 24 spaces around the edge, city center in the middle.
// Stop 0 (Central Station) is the bottom-right corner; play runs clockwise: bottom row right->left, up the left side, across the top, down the right side.
function gridPos(i) {
  if (i <= 6) return { row: 7, col: 7 - i, side: "bottom" };
  if (i <= 12) return { row: 7 - (i - 6), col: 1, side: "left" };
  if (i <= 18) return { row: 1, col: 1 + (i - 12), side: "top" };
  return { row: 1 + (i - 18), col: 7, side: "right" };
}
const CORNERS = new Set([0, 6, 12, 18]);

const WANT_3D = !/[?&]view=2d/.test(location.search) && webglAvailable();
function renderBoard3D() {
  const board = $("#board"), c = S.city;
  if (!S.b3) {
    clear(board); board.className = "board3d";
    const stage = h("div", { class: "stage", id: "stage" });
    add(board, stage, h("div", { class: "hud3d", id: "hud3d" }), h("div", { class: "hint3d" }, MOBILE.matches ? "Tap a space to open it" : "Drag to rotate · scroll to zoom · click a space"));
    try { S.b3 = new Board3D(stage, { onSelect: (id) => openDrawer(id) }); }
    catch { S.b3 = null; S.no3d = true; board.className = "board"; return renderBoard(); }
  }
  S.b3.update(c, S.me);
  const hud = clear($("#hud3d"));
  const sp = S.me.spins || {};
  add(hud,
    h("button", { class: "btn btn-primary roll", id: "roll-btn", disabled: !S.me.signedIn || !!S.me.can.move || S.busy, onclick: () => act("move") }, icon("dice-5"), "Spin"),
    h("small", { class: "roll-why" }, !S.me.signedIn ? "Connect a wallet to spin" : S.me.can.move || (sp.enabled ? `${sp.left || 0} spin${sp.left === 1 ? "" : "s"} left` : "Free spin ready")));
}

function renderBoard() {
  if (WANT_3D && !S.no3d) return renderBoard3D();
  const board = clear($("#board"));
  const c = S.city;
  const myPos = S.me.signedIn ? S.me.position : null;
  for (const st of c.stops) {
    const g = gridPos(st.id), coin = coinAt(c, st.id);
    add(board, h("button", { class: ["space", coin ? "has" : "", st.type === "station" || st.type === "vault" ? "special" : "", st.id === myPos ? "mine" : ""].join(" "), "data-stop": st.id, style: { "grid-row": g.row, "grid-column": g.col }, onclick: () => openDrawer(st.id), "aria-label": spaceName(c, st.id) },
      coin && coin.image ? h("img", { src: coin.image, alt: "" }) : null,
      h("span", { class: "nm" }, st.type === "station" ? "START" : st.type === "vault" ? "VAULT" : coin ? `$${coin.symbol}` : String(st.id).padStart(2, "0"))));
  }
  add(board, h("div", { class: "center" }, "T E K   C I T Y"));
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

function renderFeed() {
  const el = clear($("#feed"));
  for (const a of S.city.activity) add(el, h("li", { class: a.kind }, h("time", {}, fmtTime(a.at)), h("span", {}, a.text)));
}

function renderMobile() {
  const el = clear($("#mobile-bar"));
  if (!S.me.signedIn) {
    add(el, h("button", { onclick: () => openSignIn(true), style: { "grid-column": "1 / -1" } }, icon("wallet"), "Connect wallet", h("small", {}, "Phantom · Solflare · Backpack")));
    return;
  }
  const m = S.me, here = stop(m.position), sp = m.spins || {};
  const b = (ic, label, reason, fn, sub) => h("button", { disabled: !!reason || S.busy, onclick: fn }, icon(ic), label, h("small", {}, reason ? "--" : sub));
  add(el,
    b("dice-5", "Spin", m.can.move, () => act("move"), sp.enabled ? `${sp.left || 0} left` : "Ready"),
    b("square", "Space", here && here.type !== "station" ? null : "Spin first", () => openDrawer(here.id), spaceName(S.city, m.position)),
    b("wallet", "Profile", null, () => openProfile(), m.user.wallet ? m.user.wallet.short : "--"),
    b("vault", "Pool", null, () => $("#vault").scrollIntoView({ behavior: "smooth", block: "center" }), S.lpInfo ? `${sol(S.lpInfo.rewards.poolLamports || 0)}` : "--"));
}

// ------------------------------------------------------------------ drawer
function openDrawer(id) {
  S.drawer = id; S.drawerAt = performance.now();
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
function renderDrawer() {
  const dr = clear($("#drawer"));
  const s = stop(S.drawer); if (!s) return;
  const coin = coinAt(S.city, s.id);
  const kick = s.type === "station" ? "Corner" : s.type === "vault" ? "Jackpot space" : `Space ${String(s.id).padStart(2, "0")}`;
  const title = s.type === "station" ? "START" : coin ? coin.name : s.type === "vault" ? "The Vault" : "Open space";
  const header = h("header", {}, h("span", { class: "kicker" }, kick), h("h2", { id: "dr-title" }, title),
    h("span", { class: "muted small" }, coin ? `$${coin.symbol} · ${sol(coin.grownLamports)} SOL in` : s.type === "station" ? "Pass for a free spin" : "No coin yet"),
    h("button", { class: "close", onclick: closeDrawer, "aria-label": "Close" }, icon("x")));
  const body = h("div", { class: "body" });
  add(dr, header, body);
  renderCoinSection(body, S, s, LPCTX);
  renderIcons(dr);
}
// Ignore the click a touch tap fires right after it opens the drawer (it lands on the scrim while the sheet slides in).
$("#scrim").addEventListener("click", () => { if (performance.now() - (S.drawerAt || 0) > 450) closeDrawer(); });
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
      if (r.passedGo) toast("You passed START: +1 free spin.", "gold", { ms: 6000 });
      if (r.jackpotWin && r.jackpotWin.lamports > 0) toast(`Jackpot: ${(r.jackpotWin.lamports / 1e9).toFixed(3)} SOL from the community pool is on its way to your wallet.`, "gold", { ms: 10000 });
      if (r.stop && r.stop.type !== "station") setTimeout(() => openDrawer(r.stop.id), 600);
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
  S.lastRoll = roll;
  if (S.b3) { await S.b3.move(path, roll); return; }
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
  return h("div", { class: "note" }, icon("shield-check"), h("span", {}, "Connecting signs a text message only. It is not a transaction and gives no access to funds. TEK CITY never asks for your seed phrase."));
}

function openSignIn(walletFirst = false) {
  const status = h("p", { class: "small", role: "status" });
  const wallets = walletEnabled() ? walletSection(status, { title: "Choose a Solana wallet" }) : h("p", { class: "small" }, "Wallet sign-in is turned off right now.");
  const watch = h("div", { class: "row" }, h("button", { class: "btn btn-ghost", onclick: closeModal }, "Just watch"));
  openModal([h("h2", {}, "Connect to play"), h("p", {}, "Playing needs a Solana wallet. Use the wallet you trade with on pump.fun and your pump.fun profile links automatically. No wallet? You can still watch the board."), wallets, status, watch]);
  void walletFirst;
}

function walletSection(status, { purpose = "login", title = "Choose a Solana wallet" } = {}) {
  const list = h("div", { class: "wallet-list" });
  const fill = () => {
    clear(list);
    const ws = listWallets();
    for (const w of ws) {
      add(list, h("button", { onclick: () => doWallet(w, status, purpose) }, w.icon ? h("img", { src: w.icon, alt: "" }) : icon("wallet"), w.name, h("span", { class: "muted small" }, "Detected")));
    }
    if (!ws.length) {
      if (isMobile()) add(list, h("a", { class: "btn btn-cream", href: phantomBrowseLink(), rel: "noopener" }, icon("wallet"), "Open in the Phantom app"));
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
    S.me = r.me; S.pump = null;
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
  const signOut = async () => { try { await api.post("/api/auth/logout", {}); await disconnect(S.wallet); S.me = { signedIn: false }; S.pump = null; closeModal(); await refreshAll(); toast("Signed out.", "info"); } catch (e) { status.textContent = e.message; } };
  const pc = h("div", { class: "pumpcard" });
  openModal([
    h("h2", {}, "Profile"),
    h("p", {}, u.wallet ? `Wallet ${u.wallet.short} on Solana ${S.config ? S.config.solanaNetwork : ""}.` : "Connect a wallet to play."),
    h("label", { class: "small" }, "Display name"), name,
    h("div", { class: "row" }, h("button", { class: "btn btn-ghost btn-sm", onclick: save }, "Save name")),
    pc,
    !u.wallet && walletEnabled() ? walletSection(status, { purpose: "login", title: "Connect a wallet" }) : null,
    status,
    h("div", { class: "row" }, h("button", { class: "btn btn-ghost", onclick: closeModal }, "Close"), h("button", { class: "btn btn-red", onclick: signOut }, icon("log-out"), "Sign out")),
  ].filter(Boolean));
  renderPump(pc, S, LPCTX).then(() => renderIcons(pc));
}

// ------------------------------------------------------------------ tutorial
const TUT_OLD = [];
const TUT = [
  { ic: "layout-grid", t: "Every space is a coin", b: "The board has 24 spaces. They start empty. When someone launches a coin on a space, its name and image take that space." },
  { ic: "dice-5", t: "Spins", b: "Every 500,000 TEK CITY you buy earns 1 free spin. Passing START earns another. The server rolls the die." },
  { ic: "rocket", t: "Launch, grow, take over", b: "Land on an empty space to launch your coin on Pump.fun. Land on a coin to buy in, or take the space with a first buy at least as big as its largest buy-in." },
  { ic: "vault", t: "Community pool", b: "20% of creator fees from every coin on the board fill the pool. Land on the Vault for 60% of it. Every hour, 20% is split across the top holders." },
  { ic: "shield-check", t: "Your keys stay yours", b: "You approve every launch and buy in your own wallet. TEK CITY never asks for your seed phrase or private key." },
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
      h("button", { class: "btn btn-primary", onclick: () => (i < TUT.length - 1 ? openTutorial(i + 1) : finishTutorial()) }, i < TUT.length - 1 ? "Next" : "Done")),
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
  const d = new Date(); const np = $("#c-next"); if (np) np.textContent = `${String(59 - d.getMinutes()).padStart(2, "0")}:${String(59 - d.getSeconds()).padStart(2, "0")}`;
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


(async function init() {
  renderIcons();
  try {
    const [sess, config] = await Promise.all([api.session(), api.get("/api/config"), WANT_3D ? loadFonts() : null]);
    S.me = sess.me; S.config = config;
    refreshLaunchpad();
    await refreshCity();
    render();
    if (!S.me.signedIn) { if (location.hash === "#wallet") openSignIn(true); }
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
