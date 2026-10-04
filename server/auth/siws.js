"use strict";
// Sign-In With Solana style login. The server issues a single-use nonce bound to an address and an
// exact human-readable message. The wallet signs the message (ed25519, no transaction). The server
// verifies the signature against the stored message, burns the nonce, then issues a session.
const crypto = require("crypto");
const nacl = require("tweetnacl");
const { normalizeAddress, b58decode } = require("./address");
const { fail } = require("../security/util");

const STATEMENT = "Sign in to TEK CITY. This signature only proves you control this wallet. It does not authorize any transaction, transfer, token approval, or payment, and it costs nothing.";
const REAUTH_STATEMENT = "Confirm a sensitive TEK CITY account action. This signature does not authorize any transaction, transfer, token approval, or payment.";

function domainInfo(config, req) {
  const url = config.appUrl || `${req.protocol}://${req.get("host")}`;
  const u = new URL(url);
  return { domain: u.host, uri: u.origin };
}

function buildMessage({ domain, uri, address, nonce, issuedAt, expiresAt, network, purpose }) {
  return [
    `${domain} wants you to sign in with your Solana account:`,
    address,
    "",
    purpose === "reauth" ? REAUTH_STATEMENT : STATEMENT,
    "",
    `URI: ${uri}`,
    "Version: 1",
    `Chain ID: solana:${network}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expiresAt}`,
  ].join("\n");
}

async function issueNonce(client, config, req, rawAddress, purpose = "login", sessionIdHash = null) {
  const address = normalizeAddress(rawAddress);
  if (!address) fail(400, "bad_address", "That is not a valid Solana wallet address.");
  const nonce = crypto.randomBytes(16).toString("hex");
  const now = new Date();
  const exp = new Date(now.getTime() + config.nonceTtlMs);
  const { domain, uri } = domainInfo(config, req);
  const message = buildMessage({ domain, uri, address, nonce, issuedAt: now.toISOString(), expiresAt: exp.toISOString(), network: config.solana.network, purpose });
  await client.query(
    `INSERT INTO wallet_login_nonces (nonce, address, purpose, message, session_id, issued_at, expires_at, ip_hash)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [nonce, address, purpose, message, sessionIdHash, now, exp, require("../security/util").ipHash(req)]
  );
  return { nonce, message, address, expiresAt: exp.toISOString() };
}

function decodeSignature(sig) {
  if (typeof sig !== "string" || sig.length > 200) return null;
  let bytes = null;
  if (/^[A-Za-z0-9+/=_-]+$/.test(sig)) {
    try { bytes = Buffer.from(sig.replace(/-/g, "+").replace(/_/g, "/"), "base64"); } catch { bytes = null; }
  }
  if (!bytes || bytes.length !== 64) { const b = b58decode(sig); bytes = b && b.length === 64 ? Buffer.from(b) : null; }
  return bytes && bytes.length === 64 ? new Uint8Array(bytes) : null;
}

// Returns { ok: true, address, purpose } or { ok: false, reason }
async function consumeAndVerify(client, { nonce, address: rawAddress, signature, purpose, sessionIdHash }) {
  const address = normalizeAddress(rawAddress);
  if (!address) return { ok: false, reason: "bad_address" };
  if (typeof nonce !== "string" || !/^[a-f0-9]{32}$/.test(nonce)) return { ok: false, reason: "bad_nonce" };
  // Burn the nonce atomically. A nonce can only ever be consumed once, even if verification fails.
  const r = await client.query(
    `UPDATE wallet_login_nonces SET used_at = now() WHERE nonce = $1 AND used_at IS NULL RETURNING *, (expires_at <= now()) AS expired`,
    [nonce]
  );
  if (!r.rowCount) {
    const exists = await client.query(`SELECT used_at FROM wallet_login_nonces WHERE nonce = $1`, [nonce]);
    return { ok: false, reason: exists.rowCount ? "nonce_reused" : "nonce_unknown" };
  }
  const row = r.rows[0];
  if (row.expired) return { ok: false, reason: "nonce_expired" };
  if (row.address !== address) return { ok: false, reason: "address_mismatch" };
  if (row.purpose !== purpose) return { ok: false, reason: "purpose_mismatch" };
  if (row.session_id && sessionIdHash && row.session_id !== sessionIdHash) return { ok: false, reason: "session_mismatch" };
  const sig = decodeSignature(signature);
  if (!sig) return { ok: false, reason: "bad_signature_format" };
  const pub = b58decode(address);
  const ok = nacl.sign.detached.verify(new TextEncoder().encode(row.message), sig, pub);
  if (!ok) return { ok: false, reason: "bad_signature" };
  return { ok: true, address, purpose: row.purpose };
}

module.exports = { buildMessage, issueNonce, consumeAndVerify, decodeSignature, STATEMENT };
