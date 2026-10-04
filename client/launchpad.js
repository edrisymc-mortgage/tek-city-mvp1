// Launchpad UI: each board space can be a Pump.fun coin. Players launch, grow, or take over coins
// in their own wallet. The server builds and verifies transactions; the wallet signs them.
import { api } from "./lib/api.js";
import { h, icon, clear } from "./lib/dom.js";
import { walletFor, signTx } from "./lib/wallet.js";

const add = (el, ...nodes) => el.append(...nodes.flat().filter((n) => n !== null && n !== undefined && n !== false));
export const sol = (l) => (Number(l) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 3 });
const toLamports = (v) => Math.round(Number(v) * 1e9);

export function coinAt(city, stopId) { return (city.coins || []).find((c) => c.stop === stopId) || null; }

// Run one server-built transaction through the wallet and submit it.
async function signAndSubmit(S, prep, status) {
  const wallet = S.me.user.wallet && S.me.user.wallet.address;
  if (!wallet) throw new Error("Link your wallet first.");
  status("Opening your wallet. Review the transaction and approve it.");
  const handle = await walletFor(wallet, S.wallet);
  S.wallet = handle.w;
  const signedTx = await signTx(handle, prep.transaction);
  status("Sent. Waiting for Solana to confirm…");
  return api.post("/api/launchpad/submit", { intentId: prep.intentId, signedTx });
}

function readImage(file) {
  return new Promise((res, rej) => {
    if (!file) return rej(new Error("Pick an image for your coin."));
    if (!/^image\/(png|jpeg|gif|webp)$/.test(file.type)) return rej(new Error("Use a PNG, JPG, GIF, or WebP image."));
    if (file.size > 1_500_000) return rej(new Error("Image must be under 1.5 MB."));
    const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error("Couldn't read that image.")); r.readAsDataURL(file);
  });
}

function amountField(min, max, start) {
  const input = h("input", { type: "number", step: "0.01", min: String(min / 1e9), max: String(max / 1e9), value: String(start / 1e9), class: "sol-input", inputmode: "decimal" });
  const presets = h("div", { class: "presets" }, [0.05, 0.1, 0.25, 0.5, max / 1e9].filter((v, i, a) => v >= min / 1e9 && v <= max / 1e9 && a.indexOf(v) === i)
    .map((v) => h("button", { type: "button", onclick: () => { input.value = String(v); input.dispatchEvent(new Event("input")); } }, v === max / 1e9 ? `Max ${sol(max)}` : `${v} SOL`)));
  return { input, el: h("div", { class: "sol-field" }, h("div", { class: "row" }, input, h("span", { class: "unit" }, "SOL")), presets) };
}

// Drawer section for one space. `ctx` gives access to play.js helpers.
export function renderCoinSection(body, S, s, ctx) {
  const L = S.city.launchpad;
  const coin = coinAt(S.city, s.id);
  const m = S.me;
  const onSpace = m.signedIn && m.position === s.id;
  const hasWallet = m.signedIn && m.user.wallet;
  const wrap = h("div", { class: "coin-sec" });
  add(body, wrap);
  if (s.type === "station") { add(wrap, h("p", { class: "small ink2" }, "Central Station is the start. Spin to land on a space, then launch or grow a coin there.")); return; }
  if (s.type === "vault") add(wrap, h("div", { class: "jackpot-note" }, icon("vault"), h("span", {}, h("b", {}, "Jackpot space. "), "Land here on a spin to win the biggest share of the community rewards pool.")));

  if (coin) {
    add(wrap, h("div", { class: "coin-card" },
      coin.image ? h("img", { src: coin.image, alt: "", class: "coin-img" }) : h("span", { class: "coin-img ph" }, coin.symbol.slice(0, 2)),
      h("div", {}, h("b", {}, coin.name), h("span", { class: "tick" }, `$${coin.symbol}`),
        h("small", {}, `Launched by ${coin.launcher || coin.launcherWallet}`)),
      h("a", { class: "btn btn-ghost btn-sm", href: coin.pumpUrl, target: "_blank", rel: "noopener" }, icon("external-link"), "Pump.fun")),
    h("div", { class: "kv" },
      h("div", {}, h("div", { class: "k" }, "Grown on this space"), h("div", { class: "v" }, `${sol(coin.grownLamports)} SOL`)),
      h("div", {}, h("div", { class: "k" }, "Buy-ins"), h("div", { class: "v" }, String(coin.grows + 1))),
      h("div", {}, h("div", { class: "k" }, "Holding the spot"), h("div", { class: "v" }, coin.holder || "Open")),
      h("div", {}, h("div", { class: "k" }, "Take-over price"), h("div", { class: "v" }, `${sol(coin.takeoverLamports)} SOL`))));
    if (!coin.ready) add(wrap, h("div", { class: "reason" }, icon("info"), "Waiting for the launcher to confirm the 80/20 community fee split."));
  } else add(wrap, h("p", { class: "lede-sm" }, "No coin here yet. Launch one and this space becomes your coin."));

  if (!L.enabled) { add(wrap, h("div", { class: "reason" }, icon("info"), "The launchpad opens soon.")); return; }
  if (!m.signedIn) { add(wrap, h("button", { class: "btn btn-primary", onclick: ctx.signIn }, icon("wallet"), "Connect Phantom to play")); return; }
  if (!hasWallet) { add(wrap, h("button", { class: "btn btn-primary", onclick: ctx.linkWallet }, icon("wallet"), "Link Phantom to launch or grow coins")); return; }
  if (!onSpace) { add(wrap, h("div", { class: "reason" }, icon("dice-5"), "Land on this space with a spin to launch or grow here.")); return; }

  const status = h("p", { class: "small ink2 lp-status", role: "status" });
  const say = (t) => { status.textContent = t; };
  const run = async (btn, fn) => {
    if (S.busy) return; S.busy = true; btn.disabled = true;
    try { await fn(); } catch (e) { say(/reject|denied|cancel/i.test(String(e.message)) ? "Cancelled in your wallet. Nothing was sent." : e.message); ctx.toast(e.message, "err"); }
    finally { S.busy = false; btn.disabled = false; await ctx.refresh(); }
  };

  // ---- grow
  if (coin && coin.ready) {
    const f = amountField(L.minBuyLamports, L.maxBuyLamports, Math.min(L.maxBuyLamports, 100_000_000));
    const btn = h("button", { class: "btn btn-primary", type: "button" }, icon("trending-up"), `Grow $${coin.symbol}`);
    btn.onclick = () => run(btn, async () => {
      const prep = await api.post("/api/launchpad/grow", { stopId: s.id, lamports: toLamports(f.input.value) });
      const r = await signAndSubmit(S, prep, say);
      say(r.message); ctx.toast(r.message, "gold");
    });
    add(wrap, h("div", { class: "lp-block" }, h("h4", {}, `Grow $${coin.symbol}`), h("p", { class: "small ink2" }, "Buy into this coin on Pump.fun. Your buy grows the space and its buildings."), f.el, btn));
  }

  // ---- launch (empty space) or take over
  const min = coin ? Math.max(L.minBuyLamports, coin.takeoverLamports) : L.minBuyLamports;
  if (min <= L.maxBuyLamports) {
    const name = h("input", { type: "text", maxlength: "32", placeholder: "Coin name", class: "txt" });
    const ticker = h("input", { type: "text", maxlength: "10", placeholder: "TICKER", class: "txt mono", autocapitalize: "characters" });
    const desc = h("textarea", { maxlength: "280", rows: "2", placeholder: "Short description (optional)", class: "txt" });
    const file = h("input", { type: "file", accept: "image/png,image/jpeg,image/gif,image/webp", class: "file" });
    const preview = h("img", { class: "lp-preview", alt: "" }); preview.hidden = true;
    file.addEventListener("change", async () => { try { preview.src = await readImage(file.files[0]); preview.hidden = false; } catch (e) { say(e.message); } });
    const f = amountField(min, L.maxBuyLamports, Math.max(min, Math.min(L.maxBuyLamports, 50_000_000)));
    const btn = h("button", { class: `btn ${coin ? "btn-red" : "btn-primary"}`, type: "button" }, icon("rocket"), coin ? "Take over this space" : "Launch coin on Pump.fun");
    btn.onclick = () => run(btn, async () => {
      const image = await readImage(file.files[0]);
      if (name.value.trim().length < 2) throw new Error("Give your coin a name.");
      if (!/^[A-Za-z0-9]{2,10}$/.test(ticker.value.trim())) throw new Error("Ticker: 2 to 10 letters or numbers.");
      say("Uploading your coin image…");
      const prep = await api.post("/api/launchpad/launch", { stopId: s.id, name: name.value.trim(), symbol: ticker.value.trim(), description: desc.value.trim() || undefined, image, lamports: toLamports(f.input.value) });
      const r = await signAndSubmit(S, prep, say);
      say(r.message); ctx.toast(r.message, "gold", { ms: 8000 });
      if (r.next) {
        say("One more approval: confirm the 80/20 creator fee split (80% to you, 20% to TEK CITY community rewards).");
        const r2 = await signAndSubmit(S, r.next, say);
        say(r2.message); ctx.toast(r2.message, "gold");
      }
    });
    add(wrap, h("div", { class: "lp-block" },
      h("h4", {}, coin ? `Take over from $${coin.symbol}` : "Launch your coin here"),
      h("p", { class: "small ink2" }, coin
        ? `Launch a new coin on this space with a first buy of at least ${sol(min)} SOL, matching $${coin.symbol}'s biggest buy-in.`
        : "Launching is free on Pump.fun. Your first buy sets this space's take-over price. 80% of creator fees go to you, 20% to community rewards."),
      h("div", { class: "lp-form" }, name, ticker, desc, h("label", { class: "file-l" }, icon("image"), "Coin image", file), preview, h("div", { class: "k small ink2" }, "First buy"), f.el),
      btn));
  } else if (coin) add(wrap, h("p", { class: "small ink2" }, `Take-over needs more than the ${sol(L.maxBuyLamports)} SOL per-transaction limit. Grow $${coin.symbol} instead.`));

  if (coin && !coin.ready && m.user.name === coin.launcher) {
    const btn = h("button", { class: "btn btn-primary", type: "button" }, icon("check"), "Confirm 80/20 fee split");
    btn.onclick = () => run(btn, async () => { const prep = await api.post("/api/launchpad/split", { stopId: s.id }); const r = await signAndSubmit(S, prep, say); say(r.message); });
    add(wrap, btn);
  }
  add(wrap, status);
}

// Left panel in spin mode.
export function renderSpins(el, S, ctx) {
  const m = S.me, sp = m.spins || {}, here = S.city.stops[m.position];
  const coin = here ? coinAt(S.city, here.id) : null;
  add(el,
    h("div", { class: "res res2" },
      h("div", {}, h("span", { class: "k" }, icon("coins"), "TEK CITY"), h("div", { class: "v" }, sp.wallet ? Math.floor(sp.balance || 0).toLocaleString() : "--")),
      h("div", {}, h("span", { class: "k" }, icon("dice-5"), "Spins"), h("div", { class: "v" }, sp.enabled ? String(sp.left ?? 0) : m.can.move ? "0" : "1"))),
    !sp.enabled ? h("p", { class: "small muted" }, "1 free spin per round for now. Once TEK CITY launches, every 500,000 TEK CITY you hold = 1 free spin.") :
    h("p", { class: "small muted" }, sp.wallet ? `1 free spin per ${Number(sp.tokensPerSpin).toLocaleString()} TEK CITY held. ${sp.next ? `${Math.ceil(sp.next).toLocaleString()} more for your next spin.` : ""}` : "Link Phantom. Every 500,000 TEK CITY you hold = 1 free spin."),
    !m.user.wallet ? h("button", { class: "btn btn-primary", onclick: ctx.linkWallet }, icon("wallet"), "Link Phantom") : null,
    h("button", { class: "btn btn-primary spin-btn", disabled: !!m.can.move || S.busy, onclick: () => ctx.act("move") }, icon("dice-5"), "Spin"),
    m.can.move ? h("p", { class: "small ink2" }, m.can.move) : null,
    h("div", { class: "here" }, h("span", { class: "muted" }, "You're on"), h("b", {}, coin ? `$${coin.symbol}` : here ? here.name : "--"),
      h("span", { class: "muted" }, here && here.type === "station" ? "Spin to land on a space." : coin ? "Grow this coin or take the space over." : "Empty space. Launch your coin here."),
      here && here.type !== "station" ? h("button", { class: "btn btn-cream btn-sm mt8", onclick: () => ctx.openDrawer(here.id) }, icon("rocket"), coin ? "Open coin" : "Launch here") : null));
}

// Rewards panel.
export function renderRewards(el, info) {
  clear(el);
  if (!info) { add(el, h("p", { class: "small muted" }, "Loading…")); return; }
  const r = info.rewards || {};
  const now = new Date(); const mins = 59 - now.getUTCMinutes();
  add(el,
    h("div", { class: "pool" }, h("span", { class: "k" }, "Community pool"), h("b", {}, `${sol(r.poolLamports || 0)} SOL`)),
    h("ul", { class: "pool-rules" },
      h("li", {}, h("b", {}, `${(r.jackpotBps || 0) / 100}%`), " to whoever lands on the Community Vault"),
      h("li", {}, h("b", {}, `${(r.hourlyBps || 0) / 100}%`), ` split across top TEK CITY holders every hour · next in ${mins}m`),
      h("li", {}, "Grows with 20% of creator fees from every coin launched on the board")),
    (r.jackpots || []).length ? h("div", { class: "small" }, h("div", { class: "k" }, "Recent jackpots"), (r.jackpots || []).slice(0, 3).map((j) => h("div", {}, `${j.display_name || "Player"} · ${sol(j.lamports)} SOL`))) : null,
    !r.pool ? h("p", { class: "small muted" }, "Rewards wallet not configured yet.") : null);
}
