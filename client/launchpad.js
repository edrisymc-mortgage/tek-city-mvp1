// Launchpad UI: each board space can be a Pump.fun coin. Players launch, grow, or take over coins
// in their own wallet. The server builds and verifies transactions; the wallet signs them.
import { api } from "./lib/api.js";
import { h, icon, clear } from "./lib/dom.js";
import { walletFor, signTx, shortAddr } from "./lib/wallet.js";

const add = (el, ...nodes) => el.append(...nodes.flat().filter((n) => n !== null && n !== undefined && n !== false));
export const sol = (l) => (Number(l) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 3 });
const toLamports = (v) => Math.round(Number(v) * 1e9);

export function coinAt(city, stopId) { return (city.coins || []).find((c) => c.stop === stopId) || null; }

// Run one server-built transaction: show the review, have the wallet sign it, submit, wait for Solana.
async function signAndSubmit(S, prep, status, ctx) {
  const wallet = S.me.user.wallet && S.me.user.wallet.address;
  if (!wallet) throw new Error("Connect a Solana wallet first.");
  if (prep.review && !(await ctx.review(prep.review))) { status("Cancelled. Nothing was signed or sent."); const e = new Error("Cancelled. Nothing was signed or sent."); e.quiet = true; throw e; }
  status("Opening your wallet. Check the details and approve.");
  const handle = await walletFor(wallet, S.wallet);
  S.wallet = handle.w;
  let signedTx;
  try { signedTx = await signTx(handle, prep.transaction, (S.config && S.config.solanaNetwork) || "mainnet-beta"); }
  catch (e) { const er = new Error(/reject|denied|cancel|declin/i.test(String(e && e.message)) ? "You declined in your wallet. Nothing was sent." : (e && e.message) || "Your wallet couldn't sign this transaction."); er.quiet = /declined/.test(er.message); throw er; }
  status("Sent. Waiting for Solana to confirm…");
  const r = await api.post("/api/launchpad/submit", { intentId: prep.intentId, signedTx });
  if (r.pending) return waitPending(r, status);
  if (r.ok === false) throw new Error(r.message);
  return r;
}
async function waitPending(r, status) {
  for (let i = 0; i < 8; i++) {
    status(`Waiting for Solana to confirm ${shortAddr(r.signature)}. Nothing is credited until it confirms.`);
    await new Promise((res) => setTimeout(res, 15000));
    const x = await api.post("/api/launchpad/recheck", { signature: r.signature });
    if (x.ok) return x;
    if (!x.pending) throw new Error(x.message);
  }
  throw new Error(`Still not confirmed. Signature ${r.signature}. We'll keep checking in the background.`);
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
  if (s.type === "station") { add(wrap, h("p", { class: "small ink2" }, "START. Every time you pass or land here you get a free spin.")); return; }
  const VV = S.lpInfo && S.lpInfo.vault;
  if (s.type === "vault") add(wrap, h("div", { class: "jackpot-note" }, icon("vault"), h("span", {}, h("b", {}, "Vault jackpot. "), (VV && !VV.ready && VV.nextAt) ? `Already hit. Opens again at ${new Date(VV.nextAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.` : `Land here for +${(VV && VV.spins) || 1} bonus spin. Can be hit once every ${(VV && VV.cooldownHours) || 12} hours across the whole board.`)));

  if (coin) {
    add(wrap, h("div", { class: "coin-card" },
      coin.image ? h("img", { src: coin.image, alt: "", class: "coin-img" }) : h("span", { class: "coin-img ph" }, coin.symbol.slice(0, 3)),
      h("div", {}, h("b", {}, coin.name), h("span", { class: "tick" }, `$${coin.symbol}`),
        h("small", {}, `Launched by ${coin.launcher || coin.launcherWallet}`)),
      h("a", { class: "btn btn-ghost btn-sm", href: coin.pumpUrl, target: "_blank", rel: "noopener" }, icon("external-link"), "Pump.fun")),
    h("div", { class: "kv" },
      h("div", {}, h("div", { class: "k" }, "SOL bought here"), h("div", { class: "v" }, `${sol(coin.grownLamports)} SOL`)),
      h("div", {}, h("div", { class: "k" }, "Buy-ins"), h("div", { class: "v" }, String(coin.grows + 1))),
      h("div", {}, h("div", { class: "k" }, "Holding the spot"), h("div", { class: "v" }, coin.holder || "Open")),
      h("div", {}, h("div", { class: "k" }, "Take-over price"), h("div", { class: "v" }, `${sol(coin.takeoverLamports)} SOL`))));
  } else add(wrap, h("p", { class: "lede-sm" }, "No coin here yet. Launch one and this space becomes your coin."));

  if (!L.enabled) { add(wrap, h("div", { class: "reason" }, icon("info"), "The launchpad opens soon.")); return; }
  if (!m.signedIn) { add(wrap, h("button", { class: "btn btn-primary", onclick: ctx.signIn }, icon("wallet"), "Connect Solana Wallet")); return; }
  if (!hasWallet) { add(wrap, h("button", { class: "btn btn-primary", onclick: ctx.linkWallet }, icon("wallet"), "Connect Solana Wallet to launch or buy")); return; }
  if (!onSpace) { add(wrap, h("div", { class: "reason" }, icon("dice-5"), "Land on this space with a spin to launch or buy here.")); return; }

  const status = h("p", { class: "small ink2 lp-status", role: "status" });
  const say = (t) => { status.textContent = t; };
  const run = async (btn, fn) => {
    if (S.busy) return; S.busy = true; btn.disabled = true;
    try { await fn(); } catch (e) { say(e.message); if (!e.quiet) ctx.toast(e.message, "err"); }
    finally { S.busy = false; btn.disabled = false; await ctx.refresh(); }
  };

  // ---- grow
  if (coin && coin.ready) {
    const f = amountField(L.minBuyLamports, L.maxBuyLamports, Math.min(L.maxBuyLamports, 100_000_000));
    const btn = h("button", { class: "btn btn-primary", type: "button" }, icon("trending-up"), `Buy $${coin.symbol} with SOL`);
    btn.onclick = () => run(btn, async () => {
      const prep = await api.post("/api/launchpad/grow", { stopId: s.id, lamports: toLamports(f.input.value) });
      const r = await signAndSubmit(S, prep, say, ctx);
      say(r.message); ctx.toast(r.message, "gold");
    });
    add(wrap, h("div", { class: "lp-block" }, h("h4", {}, "Buy with SOL"), h("p", { class: "small ink2" }, `Buy $${coin.symbol} on Pump.fun from your connected wallet. You'll see the exact amount, fees and programs before you sign.`), f.el, btn));
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
    const btn = h("button", { class: `btn ${coin ? "btn-ghost" : "btn-primary"}`, type: "button" }, icon("rocket"), "Review Launch Cost");
    btn.onclick = () => run(btn, async () => {
      const image = await readImage(file.files[0]);
      if (name.value.trim().length < 2) throw new Error("Give your coin a name.");
      if (!/^[A-Za-z0-9]{2,10}$/.test(ticker.value.trim())) throw new Error("Ticker: 2 to 10 letters or numbers.");
      say("Uploading your coin image…");
      const prep = await api.post("/api/launchpad/launch", { stopId: s.id, name: name.value.trim(), symbol: ticker.value.trim(), description: desc.value.trim() || undefined, image, lamports: toLamports(f.input.value) });
      const r = await signAndSubmit(S, prep, say, ctx);
      say(r.message); ctx.toast(r.message, "gold", { ms: 8000 });
    });
    add(wrap, h("div", { class: "lp-block" },
      h("h4", {}, coin ? `Take over from $${coin.symbol}` : "Launch Your Coin"),
      h("p", { class: "small ink2" }, coin
        ? `Launch a new coin on this space with a first buy of at least ${sol(min)} SOL, matching $${coin.symbol}'s biggest buy-in.`
        : "Your first buy sets this space's take-over price. Your coin's creator rewards go to you."),
      h("p", { class: "small ink2" }, "Coin launches are paid directly from your connected Solana wallet through the selected launchpad. TEK CITY does not custody or take a percentage of your launch payment. Network and launchpad fees apply as displayed before transaction approval."),
      h("div", { class: "lp-form" }, name, ticker, desc, h("label", { class: "file-l" }, icon("image"), "Coin image", file), preview, h("div", { class: "k small ink2" }, "First buy"), f.el),
      btn));
  } else if (coin) add(wrap, h("p", { class: "small ink2" }, `Take-over needs more than the ${sol(L.maxBuyLamports)} SOL per-transaction limit. Buy $${coin.symbol} instead.`));

  add(wrap, status);
}

const fmtN = (n) => Math.floor(Number(n || 0)).toLocaleString();
const usd = (n) => n >= 1e6 ? `$${+(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`;
const spaceName = (city, id) => { const st = city.stops[id]; if (!st) return "--"; if (st.type === "station") return "START"; if (st.type === "vault") return "Vault"; const c = coinAt(city, id); return c ? `$${c.symbol}` : `Space ${String(id).padStart(2, "0")}`; };
export { spaceName };

// Player panel.
export function renderSpins(el, S, ctx) {
  const m = S.me, sp = m.spins || {}, here = S.city.stops[m.position];
  const coin = here ? coinAt(S.city, here.id) : null;
  const per = Number(sp.tokensPerSpin || S.city.launchpad.tokensPerSpin || 500000);
  if (sp.enabled) {
    add(el, h("div", { class: "res res3" },
      h("div", {}, h("span", { class: "k" }, "Bought"), h("div", { class: "v" }, sp.wallet ? fmtN(sp.bought) : "--")),
      h("div", {}, h("span", { class: "k" }, "Bonus"), h("div", { class: "v" }, String(sp.bonus || 0))),
      h("div", {}, h("span", { class: "k" }, "Spins"), h("div", { class: "v" }, String(sp.left ?? 0)))));
    if (sp.wallet) {
      const into = per - Number(sp.next || per);
      add(el, h("div", { class: "prog" }, h("div", { class: "row" }, h("span", {}, "Next spin"), h("span", {}, `${fmtN(into)} / ${fmtN(per)}`)), h("div", { class: "bar" }, h("i", { style: { width: `${Math.min(100, (into / per) * 100)}%` } }))));
    }
  } else if (sp.holder) {
    add(el, h("div", { class: "res" },
      h("div", {}, h("span", { class: "k" }, "TEK CITY held"), h("div", { class: "v" }, fmtN(sp.holder.balance))),
      h("div", {}, h("span", { class: "k" }, "Round spin"), h("div", { class: "v" }, !sp.holder.eligible ? "Locked" : m.can.move ? "Used" : "Ready"))));
    if (!sp.holder.eligible) add(el, h("div", { class: "prog" }, h("div", { class: "row" }, h("span", {}, "Holder spin"), h("span", {}, `${fmtN(sp.holder.balance)} / ${fmtN(sp.holder.required)}`)), h("div", { class: "bar" }, h("i", { style: { width: `${Math.min(100, (sp.holder.balance / sp.holder.required) * 100)}%` } }))));
  } else {
    add(el, h("div", { class: "res" },
      h("div", {}, h("span", { class: "k" }, "Round spin"), h("div", { class: "v" }, m.can.move ? "Used" : "Ready")),
      h("div", {}, h("span", { class: "k" }, "Bonus spins"), h("div", { class: "v" }, String((sp && sp.bonus) || 0)))));
  }
  add(el,
    h("p", {}, sp.owned ? `Your first spin is free. Then every round you get 1 spin for every ${fmtN(per)} TEK CITY you own (connected wallet + linked pump.fun profile). You own ${fmtN(sp.balance)} = ${sp.allowance} per round. Passing START: +1.` : sp.enabled ? `Your first spin is free. Then 1 spin for every ${fmtN(per)} TEK CITY you buy from your wallet or linked pump.fun profile (${fmtN(sp.bought)} bought so far, ${fmtN(Math.ceil(sp.next))} more for the next spin). Passing START: +1.` : sp.holder ? `Wallets holding ${fmtN(per)}+ TEK CITY get 1 free spin each 15-minute round, plus 1 every time they pass START.` : "1 free spin each 15-minute round, plus 1 every time you pass START."),
    h("button", { class: "btn btn-primary spin-btn", disabled: !!m.can.move || S.busy, onclick: () => ctx.act("move") }, icon("dice-5"), "Spin"),
    m.can.move ? h("p", { class: "small" }, m.can.move) : null,
    !m.user.wallet ? h("button", { class: "btn btn-ghost", onclick: ctx.linkWallet }, icon("wallet"), "Connect Solana Wallet") : null,
    h("div", { class: "here" }, h("span", { class: "muted" }, "Your pawn is on"), h("b", {}, spaceName(S.city, m.position)),
      h("span", { class: "muted" }, here && here.type === "station" ? "Spin to move." : coin ? "Buy in to grow it, or take the space over." : "Empty. Launch your coin here."),
      here && here.type !== "station" ? h("button", { class: "btn btn-cream btn-sm mt8", onclick: () => ctx.openDrawer(here.id) }, coin ? "Open space" : "Launch here") : null));
  const pc = h("div", { class: "pumpcard" }); add(el, pc);
  renderPump(pc, S, ctx);
}

// pump.fun profile: auto-detected from the linked wallet, or verified with a bio code.
export async function renderPump(el, S, ctx, fresh = false) {
  clear(el);
  if (!S.pump || fresh) { add(el, h("span", { class: "lbl" }, "pump.fun"), h("p", { class: "small mb0" }, "Checking…")); try { S.pump = await api.get("/api/pump/me"); } catch { S.pump = { linked: false }; } clear(el); }
  const P = S.pump;
  add(el, h("span", { class: "lbl" }, "pump.fun profile"));
  if (P.linked) {
    const pr = P.profile;
    add(el, h("div", { class: "who" }, pr.avatar ? h("img", { src: pr.avatar, alt: "" }) : h("span", { class: "ph" }),
      h("div", {}, h("b", {}, pr.username || `${pr.address.slice(0, 4)}…${pr.address.slice(-4)}`), h("small", {}, pr.via === "wallet" ? "Linked through your wallet" : "Verified by bio code"))));
    if ((P.coins || []).length) add(el, h("div", { class: "pcoins" }, P.coins.slice(0, 6).map((c) => h("a", { href: c.url, target: "_blank", rel: "noopener" }, c.image ? h("img", { src: c.image, alt: "" }) : null, `$${c.symbol}`))));
    add(el, h("a", { class: "btn btn-ghost btn-sm", href: pr.url, target: "_blank", rel: "noopener" }, icon("external-link"), "View on pump.fun"));
    if (pr.via === "bio") add(el, h("button", { class: "btn btn-ghost btn-sm", onclick: async () => { await api.post("/api/pump/unlink", {}); S.pump = null; renderPump(el, S, ctx); } }, "Unlink"));
    return;
  }
  const status = h("p", { class: "small mb0", role: "status" });
  if (P.pending) {
    add(el, h("p", { class: "small mb0" }, "Add this code anywhere in your pump.fun bio, save, then verify. You can remove it afterwards."),
      h("div", { class: "code" }, P.pending.code),
      h("a", { class: "btn btn-ghost btn-sm", href: "https://pump.fun/profile/edit", target: "_blank", rel: "noopener" }, icon("external-link"), "Edit pump.fun profile"),
      h("button", { class: "btn btn-primary btn-sm", onclick: async (e) => { e.target.disabled = true; try { const r = await api.post("/api/pump/link/verify", {}); S.pump = { linked: true, profile: r.profile, coins: r.coins }; ctx.toast("pump.fun profile linked.", "ok"); renderPump(el, S, ctx); ctx.refresh(); } catch (er) { status.textContent = er.message; e.target.disabled = false; } } }, "Verify"),
      h("button", { class: "btn btn-ghost btn-sm", onclick: async () => { await api.post("/api/pump/unlink", {}); S.pump = null; renderPump(el, S, ctx); } }, "Start over"), status);
    return;
  }
  if (!P.bioLink) {
    add(el, h("p", { class: "small mb0" }, "Use a Solana wallet you control, such as Phantom, Solflare, or Backpack. SOL and tokens are available when they are held by the wallet you connect."),
      h("p", { class: "small mb0" }, "Bought on pump.fun with Phantom? Connect that same Phantom wallet and your pump.fun profile shows up here."));
    return;
  }
  const input = h("input", { class: "txt", placeholder: "pump.fun/profile/… or wallet address", autocomplete: "off" });
  add(el, h("p", { class: "small mb0" }, "Buy TEK CITY on pump.fun with an email or X login? Paste your pump.fun profile link and add a short code to your bio. Buys from that pump.fun wallet then count toward your spins. Read-only: TEK CITY can't move anything in it."), input,
    h("button", { class: "btn btn-ghost btn-sm", onclick: async (e) => { e.target.disabled = true; try { const r = await api.post("/api/pump/link/start", { address: input.value }); S.pump = { linked: false, pending: { address: r.address, code: r.code } }; renderPump(el, S, ctx); } catch (er) { status.textContent = er.message; e.target.disabled = false; } } }, "Link pump.fun"), status);
}

// Milestones panel.
export function renderMilestones(el, info) {
  clear(el);
  const ms = info && info.milestones;
  if (!ms) { add(el, h("p", { class: "small mb0" }, "Loading…")); return; }
  add(el, h("div", { class: "ms-cap" }, h("span", {}, "TEK CITY mcap"), h("span", {}, ms.mcapUsd ? usd(ms.mcapUsd) : "Not live yet")));
  const firstOpen = ms.ladder.findIndex((m) => m.status !== "done");
  add(el, h("ul", { class: "ms" }, ms.ladder.slice(Math.max(0, firstOpen - 1), Math.max(0, firstOpen - 1) + 5).map((m) =>
    h("li", { class: m.status }, h("span", { class: "c" }, usd(m.mcap)), h("span", { class: "t" }, m.title), h("span", { class: "s" }, m.status === "done" ? "Done" : m.status === "funding" ? "Paying" : "")))));
}

// Coins list.
export function renderCoins(el, S, ctx) {
  clear(el);
  const coins = [...(S.city.coins || [])].sort((a, b) => Number(b.grownLamports) - Number(a.grownLamports));
  const n = document.getElementById("coins-n"); if (n) n.textContent = `${coins.length} / ${S.city.stops.length - 1}`;
  if (!coins.length) { add(el, h("p", { class: "empty-note mb0" }, "No coins yet. Every space is open. Spin and launch the first one.")); return; }
  add(el, h("div", { class: "coins" }, coins.slice(0, 12).map((c) => h("button", { class: "coin-row", onclick: () => ctx.openDrawer(c.stop) },
    c.image ? h("img", { src: c.image, alt: "" }) : h("span", { class: "ph" }, c.symbol.slice(0, 3)),
    h("span", {}, h("b", {}, c.name), h("small", {}, `$${c.symbol} · space ${String(c.stop).padStart(2, "0")}`)),
    h("span", { class: "amt" }, `${sol(c.grownLamports)} SOL`)))));
}

// Spins panel (was the community pool panel). Gameplay only.
export function renderRewards(el, info) {
  clear(el);
  if (!info) { add(el, h("p", { class: "small mb0" }, "Loading…")); return; }
  const per = Number(info.tokensPerSpin || 500000).toLocaleString();
  add(el,
    h("ul", { class: "pool-rules" },
      h("li", {}, h("span", {}, "First spin"), h("b", {}, "Free")),
      h("li", {}, h("span", {}, `Every ${per} TEK CITY bought`), h("b", {}, info.spinToken ? "+1 spin" : "When token is live")),
      h("li", {}, h("span", {}, "Pass START"), h("b", {}, "+1 spin")),
      h("li", {}, h("span", {}, "Vault jackpot (once per 12h)"), h("b", {}, info.vault && !info.vault.ready && info.vault.nextAt ? `Next ${new Date(info.vault.nextAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Ready")),
      h("li", {}, h("span", {}, "TEK CITY fee on launches"), h("b", {}, "0%"))),
    h("p", { class: "small mb0" }, "TEK CITY tokens provide game utility only. They do not provide equity, dividends, revenue share, profit rights, ownership of Community Fund assets, or guaranteed financial returns."));
}
