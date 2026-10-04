// Solana wallets via the Wallet Standard (@wallet-standard/app): Phantom, Solflare, Backpack and any
// other wallet that registers itself with the standard. No wallet-specific globals (no window.solana).
//  - Sign-in: standard:connect + solana:signMessage on a server-issued, single-use, short-expiry nonce.
//  - Launch / buy: solana:signTransaction. The player reviews and signs every transaction in their wallet;
//    the server verifies it, sends it, and only records it after Solana confirms it.
import { getWallets } from "@wallet-standard/app";
import { api } from "./api.js";

const SIGN = "solana:signMessage";
const SIGN_TX = "solana:signTransaction";
const CONNECT = "standard:connect";
const DISCONNECT = "standard:disconnect";

function b64(bytes) { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s); }
function unb64(s) { const bin = atob(s); const out = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i); return out; }

export const shortAddr = (a) => (a ? `${a.slice(0, 4)}...${a.slice(-4)}` : "");

// Wallets we point people to when none is installed. Official sites only.
export const KNOWN_WALLETS = [
  { name: "Phantom", url: "https://phantom.com/download", browse: (u) => `https://phantom.app/ul/browse/${encodeURIComponent(u)}?ref=${encodeURIComponent(location.origin)}` },
  { name: "Solflare", url: "https://solflare.com/download", browse: (u) => `https://solflare.com/ul/v1/browse/${encodeURIComponent(u)}?ref=${encodeURIComponent(location.origin)}` },
  { name: "Backpack", url: "https://backpack.app/download", browse: null },
];

export function listWallets() {
  const { get } = getWallets();
  return get()
    .filter((w) => w.features[CONNECT] && w.features[SIGN] && w.chains.some((c) => c.startsWith("solana:")))
    .map((w) => ({ name: w.name, icon: w.icon, kind: "standard", canSignTx: !!w.features[SIGN_TX], ref: w }));
}

export function onWalletsChanged(cb) { const { on } = getWallets(); return on("register", cb); }

export function isMobile() { return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent); }

async function connect(w) {
  const { accounts } = await w.ref.features[CONNECT].connect();
  const acct = accounts.find((a) => a.chains.some((c) => c.startsWith("solana:"))) || accounts[0];
  if (!acct) throw new Error("The wallet didn't share an account.");
  return { address: acct.address, account: acct };
}

async function sign(w, account, message) {
  const [out] = await w.ref.features[SIGN].signMessage({ account, message: new TextEncoder().encode(message) });
  return b64(out.signature);
}

// Sign-in: the server issues a one-time message, the wallet signs it, the server verifies the signature.
export async function signInWith(w, { purpose = "login", onMessage } = {}) {
  const { address, account } = await connect(w);
  const n = await api.post("/api/auth/nonce", { address, purpose });
  if (onMessage) onMessage(n.message);
  const signature = await sign(w, account, n.message);
  const r = await api.post("/api/auth/verify", { address, nonce: n.nonce, signature, purpose, walletName: String(w.name || "").slice(0, 40) });
  try { localStorage.setItem("tc_wallet", w.name); } catch { /* private mode */ }
  return r;
}

// Find an installed wallet whose account matches the address signed in to TEK CITY.
export async function walletFor(address, preferred) {
  const ws = listWallets().filter((w) => w.canSignTx);
  let last = null; try { last = localStorage.getItem("tc_wallet"); } catch { /* ignore */ }
  const order = [...ws].sort((a, b) => (b.ref === (preferred && preferred.ref)) - (a.ref === (preferred && preferred.ref)) || (b.name === last) - (a.name === last));
  if (!order.length) throw new Error("No Solana wallet that can sign transactions was found. Install Phantom, Solflare or Backpack, then reload.");
  for (const w of order) {
    const { address: a, account } = await connect(w);
    if (a === address) return { w, account };
  }
  throw new Error(`Switch your wallet to the account signed in to TEK CITY (${shortAddr(address)}) and try again.`);
}

// Ask the wallet to sign a base64 transaction built by the server. Returns the signed transaction as base64.
export async function signTx({ w, account }, txB64, network = "mainnet-beta") {
  const chain = network === "mainnet-beta" ? "solana:mainnet" : `solana:${network}`;
  const [out] = await w.ref.features[SIGN_TX].signTransaction({ account, transaction: unb64(txB64), chain });
  return b64(out.signedTransaction);
}

export async function disconnect(w) {
  try { if (w && w.ref.features[DISCONNECT]) await w.ref.features[DISCONNECT].disconnect(); } catch { /* ignore */ }
  try { localStorage.removeItem("tc_wallet"); } catch { /* ignore */ }
}

// Kept for callers that only need the Phantom in-app browser link.
export function phantomBrowseLink() { return KNOWN_WALLETS[0].browse(location.href); }
