// Optional Solana wallet identity via the Wallet Standard (Phantom, Solflare, Backpack, ...).
// Sign-in uses standard:connect + solana:signMessage (a plain-text login message).
// Launchpad uses solana:signTransaction: the player reviews and signs each Pump.fun transaction in their own wallet.
import { getWallets } from "@wallet-standard/app";
import { api } from "./api.js";

const SIGN = "solana:signMessage";
const CONNECT = "standard:connect";
const DISCONNECT = "standard:disconnect";

function b64(bytes) { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); }

export function listWallets() {
  const { get } = getWallets();
  const std = get().filter((w) => w.features[CONNECT] && w.features[SIGN] && w.chains.some((c) => c.startsWith("solana:")))
    .map((w) => ({ name: w.name, icon: w.icon, kind: "standard", ref: w }));
  // Legacy injected Phantom provider fallback (signMessage only).
  const legacy = (window.phantom && window.phantom.solana) || (window.solana && window.solana.isPhantom ? window.solana : null);
  if (legacy && !std.some((w) => /phantom/i.test(w.name))) std.push({ name: "Phantom", icon: null, kind: "legacy", ref: legacy });
  return std;
}

export function onWalletsChanged(cb) { const { on } = getWallets(); return on("register", cb); }

export function isMobile() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }
export function phantomBrowseLink() {
  const url = encodeURIComponent(location.href);
  return `https://phantom.app/ul/browse/${url}?ref=${encodeURIComponent(location.origin)}`;
}

async function connect(w) {
  if (w.kind === "legacy") {
    const r = await w.ref.connect();
    return { address: r.publicKey.toString(), account: null };
  }
  const { accounts } = await w.ref.features[CONNECT].connect();
  const acct = accounts.find((a) => a.chains.some((c) => c.startsWith("solana:"))) || accounts[0];
  if (!acct) throw new Error("The wallet didn't share an account.");
  return { address: acct.address, account: acct };
}

async function sign(w, account, message) {
  const bytes = new TextEncoder().encode(message);
  if (w.kind === "legacy") {
    const r = await w.ref.signMessage(bytes, "utf8");
    return b64(r.signature);
  }
  const [out] = await w.ref.features[SIGN].signMessage({ account, message: bytes });
  return b64(out.signature);
}

// Full sign-in: ask the server for a one-time message, have the wallet sign it, let the server verify.
export async function signInWith(w, { purpose = "login", onMessage } = {}) {
  const { address, account } = await connect(w);
  const n = await api.post("/api/auth/nonce", { address, purpose });
  if (onMessage) onMessage(n.message);
  const signature = await sign(w, account, n.message);
  return api.post("/api/auth/verify", { address, nonce: n.nonce, signature, purpose });
}

const SIGN_TX = "solana:signTransaction";
function unb64(s) { const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }

// Find a connected wallet whose account matches the address linked to this TEK CITY account.
export async function walletFor(address, preferred) {
  const ws = listWallets().filter((w) => w.kind === "standard" && w.ref.features[SIGN_TX]);
  const order = preferred && preferred.kind === "standard" ? [preferred, ...ws.filter((w) => w.ref !== preferred.ref)] : ws;
  if (!order.length) throw new Error("No wallet that can sign transactions was found. Open TEK CITY in Phantom or install the Phantom extension.");
  for (const w of order) {
    const { address: a, account } = await connect(w);
    if (a === address) return { w, account };
  }
  throw new Error(`Switch your wallet to the account linked to TEK CITY (${address.slice(0, 4)}…${address.slice(-4)}) and try again.`);
}

// Ask the wallet to sign a base64 transaction built by the server. Returns the signed transaction as base64.
export async function signTx({ w, account }, txB64) {
  const [out] = await w.ref.features[SIGN_TX].signTransaction({ account, transaction: unb64(txB64), chain: "solana:mainnet" });
  return b64(out.signedTransaction);
}

export async function disconnect(w) {
  try {
    if (!w) return;
    if (w.kind === "legacy") await w.ref.disconnect();
    else if (w.ref.features[DISCONNECT]) await w.ref.features[DISCONNECT].disconnect();
  } catch { /* ignore */ }
}
