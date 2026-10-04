"use strict";
// Solana addresses are base58-encoded 32-byte ed25519 public keys. Base58 is case-sensitive,
// so normalization = trim + strict decode + canonical re-encode. Anything else is rejected.
const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const MAP = new Map([...ALPHABET].map((c, i) => [c, i]));

function b58decode(str) {
  if (typeof str !== "string" || str.length === 0 || str.length > 88) return null;
  let n = 0n;
  for (const ch of str) {
    const v = MAP.get(ch);
    if (v === undefined) return null;
    n = n * 58n + BigInt(v);
  }
  let hex = n.toString(16);
  if (n === 0n) hex = "";
  if (hex.length % 2) hex = "0" + hex;
  const body = Buffer.from(hex, "hex");
  let zeros = 0;
  while (zeros < str.length && str[zeros] === "1") zeros++;
  return Uint8Array.from(Buffer.concat([Buffer.alloc(zeros), body]));
}

function b58encode(bytes) {
  const buf = Buffer.from(bytes);
  let n = BigInt("0x" + (buf.toString("hex") || "0"));
  let out = "";
  while (n > 0n) { out = ALPHABET[Number(n % 58n)] + out; n /= 58n; }
  for (const b of buf) { if (b === 0) out = "1" + out; else break; }
  return out;
}

function normalizeAddress(input) {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) return null;
  const bytes = b58decode(s);
  if (!bytes || bytes.length !== 32) return null;
  const canonical = b58encode(bytes);
  return canonical === s ? canonical : null;
}

const shortAddress = (a) => (a ? `${a.slice(0, 4)}...${a.slice(-4)}` : "");

module.exports = { b58decode, b58encode, normalizeAddress, shortAddress };
