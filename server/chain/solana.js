"use strict";
// Minimal Solana JSON-RPC client (server-side only). The RPC URL is never sent to the browser.
const { VersionedTransaction, PublicKey } = require("@solana/web3.js");
const { fail } = require("../security/util");

let CFG = null;
function configure(config) { CFG = config; }

async function rpc(method, params) {
  const res = await fetch(CFG.launchpad.rpcUrl, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    signal: AbortSignal.timeout(20000),
  });
  const j = await res.json().catch(() => null);
  if (!j || j.error) fail(502, "rpc_error", `Solana network error${j && j.error ? `: ${String(j.error.message).slice(0, 140)}` : ""}.`);
  return j.result;
}

// Sum of a wallet's balance of one SPL / Token-2022 mint, in whole tokens. Cached 60s.
const balCache = new Map();
async function tokenBalance(owner, mint) {
  const k = `${owner}|${mint}`, hit = balCache.get(k);
  if (hit && Date.now() - hit.at < 60e3) return hit.v;
  let total = 0;
  for (const programId of ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"]) {
    try {
      const r = await rpc("getTokenAccountsByOwner", [owner, { mint }, { encoding: "jsonParsed" }]);
      for (const a of (r && r.value) || []) total += Number(a.account.data.parsed.info.tokenAmount.uiAmount || 0);
      break; // the mint filter already covers whichever program owns it
    } catch (e) { if (programId.startsWith("Tokenz")) throw e; }
  }
  balCache.set(k, { at: Date.now(), v: total });
  return total;
}

function bustBalance(owner, mint) { balCache.delete(`${owner}|${mint}`); }

function decode(b64) {
  try { return VersionedTransaction.deserialize(Buffer.from(b64, "base64")); }
  catch { fail(400, "bad_tx", "That transaction could not be read."); }
}

// Resolve each instruction to a stable string (program + accounts + data), independent of account ordering,
// so we can prove a wallet-signed transaction still contains every instruction we built.
function instructionKeys(tx) {
  const m = tx.message;
  const stat = m.staticAccountKeys.map((k) => k.toBase58());
  const lookups = [];
  for (const l of m.addressTableLookups || []) for (const i of l.writableIndexes) lookups.push(`alt:${l.accountKey.toBase58()}:${i}`);
  for (const l of m.addressTableLookups || []) for (const i of l.readonlyIndexes) lookups.push(`alt:${l.accountKey.toBase58()}:${i}`);
  const key = (i) => (i < stat.length ? stat[i] : lookups[i - stat.length] || `?${i}`);
  return m.compiledInstructions.map((ix) => `${key(ix.programIdIndex)}|${ix.accountKeyIndexes.map(key).join(",")}|${Buffer.from(ix.data).toString("base64")}`);
}
const WALLET_ADDED_PROGRAMS = new Set(["ComputeBudget111111111111111111111111111111", "L2TExMFKdjpN9kozasaurPirfHy9P8sbXoAN1qA3S95"]);

// The signed tx must: be paid by the user's wallet, carry a valid user signature, and contain every instruction
// we built. Wallets may only add compute-budget / Lighthouse guard instructions.
function verifySigned(builtB64, signedB64, wallet) {
  const built = decode(builtB64), signed = decode(signedB64);
  const payer = signed.message.staticAccountKeys[0].toBase58();
  if (payer !== wallet) fail(400, "wrong_wallet", "This transaction must be signed by the wallet linked to your account.");
  const want = instructionKeys(built), got = instructionKeys(signed);
  const gotSet = new Map(); for (const g of got) gotSet.set(g, (gotSet.get(g) || 0) + 1);
  for (const w of want) {
    if (w.startsWith("ComputeBudget111111111111111111111111111111|")) continue;
    const n = gotSet.get(w) || 0; if (!n) fail(400, "tx_modified", "The signed transaction doesn't match what TEK CITY prepared. Nothing was sent.");
    gotSet.set(w, n - 1);
  }
  for (const [g, n] of gotSet) if (n > 0 && !WALLET_ADDED_PROGRAMS.has(g.split("|")[0]) && !want.includes(g)) fail(400, "tx_modified", "The signed transaction has extra instructions. Nothing was sent.");
  const nacl = require("tweetnacl");
  const sig = signed.signatures[0];
  if (!sig || !nacl.sign.detached.verify(signed.message.serialize(), sig, new PublicKey(wallet).toBytes())) fail(400, "bad_signature", "Your wallet signature is missing or invalid.");
  return signed;
}

async function sendAndConfirm(signedB64) {
  const sig = await rpc("sendTransaction", [signedB64, { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed", maxRetries: 5 }]);
  const until = Date.now() + 60e3;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, 1500));
    const st = await rpc("getSignatureStatuses", [[sig], { searchTransactionHistory: false }]);
    const s = st && st.value && st.value[0];
    if (s && s.err) fail(409, "tx_failed", "The transaction failed on Solana. No changes were made in TEK CITY.");
    if (s && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) return sig;
  }
  fail(504, "tx_timeout", `Solana hasn't confirmed this yet. Signature: ${sig}`);
}

async function getTx(sig) {
  for (let i = 0; i < 8; i++) {
    const t = await rpc("getTransaction", [sig, { encoding: "jsonParsed", commitment: "confirmed", maxSupportedTransactionVersion: 0 }]);
    if (t) return t;
    await new Promise((r) => setTimeout(r, 1500));
  }
  fail(504, "tx_timeout", "Couldn't read the confirmed transaction yet.");
}

// Token amount (whole tokens) the wallet gained of `mint` in a confirmed tx, and SOL it spent (lamports, incl. fees).
function effects(t, wallet, mint) {
  const keys = t.transaction.message.accountKeys.map((k) => (typeof k === "string" ? k : k.pubkey));
  const i = keys.indexOf(wallet);
  const spent = i >= 0 ? Number(t.meta.preBalances[i]) - Number(t.meta.postBalances[i]) : 0;
  const sum = (arr) => (arr || []).filter((b) => b.mint === mint && b.owner === wallet).reduce((a, b) => a + Number(b.uiTokenAmount.uiAmount || 0), 0);
  return { ok: !t.meta.err, spentLamports: spent, tokensGained: sum(t.meta.postTokenBalances) - sum(t.meta.preTokenBalances), keys };
}

// ---- transaction lifecycle helpers (idempotent settlement)
const bs58 = require("bs58");
const b58 = (bytes) => (bs58.default || bs58).encode(Buffer.from(bytes));
// The transaction signature is the fee payer's signature, known before we send it.
function sigOf(signed) { const s = signed.signatures[0]; if (!s || s.every((b) => b === 0)) fail(400, "bad_signature", "Your wallet signature is missing."); return b58(s); }

const PROGRAM_LABELS = {
  "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P": "Pump.fun bonding curve",
  "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA": "PumpSwap AMM",
  "pfeeUxB6jkeY1Hxd7CsFCAjcbHA9rWtchMGdZ6VojVZ": "Pump.fun fee program",
  "11111111111111111111111111111111": "System program",
  "ComputeBudget111111111111111111111111111111": "Compute budget",
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA": "SPL Token",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb": "Token-2022",
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL": "Associated token account",
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s": "Metaplex metadata",
};
// What the wallet will be asked to sign: programs touched, payer, estimated network fee.
function review(b64) {
  const tx = decode(b64), m = tx.message;
  const stat = m.staticAccountKeys.map((k) => k.toBase58());
  const programs = [...new Set(m.compiledInstructions.map((ix) => stat[ix.programIdIndex]))].map((id) => ({ id, label: PROGRAM_LABELS[id] || "Other program" }));
  let price = 0, limit = 200000 * m.compiledInstructions.length;
  for (const ix of m.compiledInstructions) {
    if (stat[ix.programIdIndex] !== "ComputeBudget111111111111111111111111111111") continue;
    const d = Buffer.from(ix.data);
    if (d[0] === 2 && d.length >= 5) limit = d.readUInt32LE(1);
    if (d[0] === 3 && d.length >= 9) price = Number(d.readBigUInt64LE(1));
  }
  const feeLamports = 5000 * m.header.numRequiredSignatures + Math.ceil((price * limit) / 1e6);
  // Direct SOL transfers (System Program "Transfer", index 2) with their recipients, shown to the player.
  const transfers = [];
  for (const ix of m.compiledInstructions) {
    if (stat[ix.programIdIndex] !== "11111111111111111111111111111111") continue;
    const d = Buffer.from(ix.data);
    if (d.length >= 12 && d.readUInt32LE(0) === 2) transfers.push({ from: stat[ix.accountKeyIndexes[0]] || "lookup", to: stat[ix.accountKeyIndexes[1]] || "lookup", lamports: Number(d.readBigUInt64LE(4)) });
  }
  return { payer: stat[0], programs, feeLamports, transfers, accounts: stat, lookupTables: (m.addressTableLookups || []).map((l) => l.accountKey.toBase58()), unknownPrograms: programs.filter((p) => p.label === "Other program").length };
}

async function send(signedB64) {
  return rpc("sendTransaction", [signedB64, { encoding: "base64", skipPreflight: false, preflightCommitment: "confirmed", maxRetries: 5 }]);
}
// "confirmed" | "finalized" | "failed" | "pending" | "unknown"
async function sigStatus(sig) {
  const st = await rpc("getSignatureStatuses", [[sig], { searchTransactionHistory: true }]);
  const s = st && st.value && st.value[0];
  if (!s) return { state: "unknown" };
  if (s.err) return { state: "failed", err: s.err };
  if (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized") return { state: s.confirmationStatus };
  return { state: "pending" };
}
async function blockhashValid(blockhash) {
  const r = await rpc("isBlockhashValid", [blockhash, { commitment: "confirmed" }]);
  return !!(r && r.value);
}
async function waitFor(sig, ms = 60e3) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    await new Promise((r) => setTimeout(r, 1500));
    const s = await sigStatus(sig).catch(() => ({ state: "unknown" }));
    if (s.state !== "unknown" && s.state !== "pending") return s;
  }
  return { state: "timeout" };
}

async function solBalance(addr) { const r = await rpc("getBalance", [addr, { commitment: "confirmed" }]); return Number((r && r.value) || 0); }

module.exports = { configure, bustBalance, rpc, tokenBalance, verifySigned, sendAndConfirm, getTx, effects, solBalance, decode, sigOf, review, send, sigStatus, blockhashValid, waitFor, PROGRAM_LABELS };
