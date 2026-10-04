"use strict";
// Server-side sessions. The browser holds an opaque random token in an HttpOnly, Secure, SameSite=Lax cookie.
// The database stores only an HMAC of that token. Every state-changing request needs a matching CSRF token.
const cookie = require("cookie");
const db = require("../db/pool");
const { hmac, randomToken, safeEqual, ipHash, uaHash, fail } = require("../security/util");

let CFG = null;
function configure(config) { CFG = config; }
const cookieName = () => (CFG.isProd ? "__Host-tc_sid" : "tc_sid");
const tokenHash = (t) => hmac(t, "sid");

function ttlFor(method) {
  return method === "wallet" ? CFG.session.walletTtlMs : method === "guest" ? CFG.session.guestTtlMs : CFG.session.anonTtlMs;
}

function setCookie(res, token, maxAgeMs) {
  res.append("Set-Cookie", cookie.serialize(cookieName(), token, {
    httpOnly: true, secure: CFG.isProd, sameSite: "lax", path: "/", maxAge: Math.floor(maxAgeMs / 1000),
  }));
}
function clearCookie(res) {
  res.append("Set-Cookie", cookie.serialize(cookieName(), "", { httpOnly: true, secure: CFG.isProd, sameSite: "lax", path: "/", maxAge: 0 }));
}

function readToken(headerCookie) {
  if (!headerCookie) return null;
  const parsed = cookie.parse(headerCookie);
  const t = parsed[cookieName()];
  return t && /^[A-Za-z0-9_-]{40,60}$/.test(t) ? t : null;
}

async function findByToken(token) {
  if (!token) return null;
  const r = await db.query(
    `SELECT s.*, u.display_name, u.kind AS user_kind, u.is_banned, u.avatar_seed
       FROM sessions s LEFT JOIN users u ON u.id = s.user_id
      WHERE s.id_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > now()`,
    [tokenHash(token)]
  );
  return r.rows[0] || null;
}

// middleware: attach req.session (or null)
async function loadSession(req, _res, next) {
  try {
    const token = readToken(req.headers.cookie);
    const s = await findByToken(token);
    req.session = s && !s.is_banned ? s : null;
    req.sessionToken = req.session ? token : null;
    if (req.session && Date.now() - new Date(req.session.last_seen_at).getTime() > 5 * 60e3) {
      db.query(`UPDATE sessions SET last_seen_at = now() WHERE id_hash = $1`, [req.session.id_hash]).catch(() => {});
    }
    next();
  } catch (e) { next(e); }
}

async function createSession(client, req, res, { userId = null, method = "anon", wallet = null, reauth = false }) {
  const q = client || db;
  if (req.session) await q.query(`UPDATE sessions SET revoked_at = now() WHERE id_hash = $1`, [req.session.id_hash]); // rotate: prevents fixation
  const token = randomToken(32);
  const csrf = randomToken(24);
  const ttl = ttlFor(method);
  await q.query(
    `INSERT INTO sessions (id_hash, user_id, auth_method, wallet_address, csrf_token, expires_at, reauth_at, ip_hash, ua_hash)
     VALUES ($1,$2,$3,$4,$5, now() + ($6 || ' milliseconds')::interval, $7, $8, $9)`,
    [tokenHash(token), userId, method, wallet, csrf, String(ttl), reauth ? new Date() : null, ipHash(req), uaHash(req)]
  );
  setCookie(res, token, ttl);
  const r = await q.query(`SELECT s.*, u.display_name, u.kind AS user_kind, u.is_banned, u.avatar_seed FROM sessions s LEFT JOIN users u ON u.id = s.user_id WHERE s.id_hash = $1`, [tokenHash(token)]);
  req.session = r.rows[0];
  req.sessionToken = token;
  return req.session;
}

async function ensureSession(req, res) {
  if (req.session) return req.session;
  return createSession(null, req, res, { method: "anon" });
}

async function revoke(req, res) {
  if (req.session) await db.query(`UPDATE sessions SET revoked_at = now() WHERE id_hash = $1`, [req.session.id_hash]);
  clearCookie(res);
  req.session = null;
}

function originAllowed(req) {
  const origin = req.get("Origin");
  if (origin) return CFG.allowedOrigins.has(origin);
  const ref = req.get("Referer");
  if (ref) { try { return CFG.allowedOrigins.has(new URL(ref).origin); } catch { return false; } }
  return !CFG.isProd; // non-browser clients without Origin are only allowed outside production
}

// CSRF: double-check Origin and a per-session token sent in a custom header.
function csrf(req, _res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  try {
    if (!originAllowed(req)) fail(403, "bad_origin", "Request origin not allowed.");
    if (!req.session) fail(401, "no_session", "Your session expired. Refresh the page.");
    if (!safeEqual(req.get("X-CSRF-Token"), req.session.csrf_token)) fail(403, "csrf", "Security check failed. Refresh the page and try again.");
    next();
  } catch (e) { next(e); }
}

function requireUser(req, _res, next) {
  if (!req.session || !req.session.user_id) return next(Object.assign(new (require("../security/util").UserError)(401, "sign_in_required", "Play as a guest or sign in with a wallet first.")));
  next();
}

function requireRecentWalletAuth(req) {
  const s = req.session;
  if (!s || s.auth_method !== "wallet" || !s.reauth_at || Date.now() - new Date(s.reauth_at).getTime() > CFG.session.reauthWindowMs) {
    fail(401, "reauth_required", "Please confirm this action by signing a fresh message with your wallet.");
  }
}

module.exports = { configure, loadSession, createSession, ensureSession, revoke, csrf, requireUser, requireRecentWalletAuth, readToken, findByToken, originAllowed, cookieName };
