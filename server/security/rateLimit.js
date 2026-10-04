"use strict";
// Fixed-window rate limiter (in-memory, single instance). Blocks are recorded to rate_limit_events
// and repeated offenders raise abuse flags. Swap the store for Redis before running multiple instances.
const db = require("../db/pool");
const { hmac, ipHash } = require("./util");

class Limiter {
  constructor() { this.hits = new Map(); this.blocks = new Map(); }
  // returns { ok, remaining, resetMs }
  take(bucket, key, max, windowMs, now = Date.now()) {
    const k = `${bucket}|${key}`;
    let e = this.hits.get(k);
    if (!e || now >= e.reset) { e = { count: 0, reset: now + windowMs }; this.hits.set(k, e); }
    e.count++;
    if (this.hits.size > 50000) this.sweep(now);
    return { ok: e.count <= max, remaining: Math.max(0, max - e.count), resetMs: e.reset - now, first: e.count === max + 1 };
  }
  noteBlock(key, now = Date.now()) {
    let b = this.blocks.get(key);
    if (!b || now - b.start > 3600e3) { b = { start: now, n: 0 }; this.blocks.set(key, b); }
    return ++b.n;
  }
  sweep(now = Date.now()) { for (const [k, e] of this.hits) if (now >= e.reset) this.hits.delete(k); }
  reset() { this.hits.clear(); this.blocks.clear(); }
}
const limiter = new Limiter();

const POLICIES = {
  api_read: { max: 240, windowMs: 60e3 },
  leaderboard: { max: 60, windowMs: 60e3 },
  session: { max: 60, windowMs: 60e3 },
  auth_nonce: { max: 10, windowMs: 60e3 },
  auth_verify_ip: { max: 10, windowMs: 60e3 },
  auth_verify_wallet: { max: 5, windowMs: 60e3 },
  guest_create: { max: 5, windowMs: 10 * 60e3 },
  game_action_user: { max: 30, windowMs: 60e3 },
  game_action_ip: { max: 90, windowMs: 60e3 },
  support: { max: 3, windowMs: 10 * 60e3 },
  admin: { max: 60, windowMs: 60e3 },
  socket_connect: { max: 20, windowMs: 60e3 },
};

function overrides() { return global.__TEKCITY_RATE_OVERRIDES || {}; }

async function recordBlock(bucket, keyHash, subject) {
  const n = limiter.noteBlock(keyHash);
  try {
    if (n === 1 || n % 10 === 0) await db.query(`INSERT INTO rate_limit_events (bucket, key_hash) VALUES ($1,$2)`, [bucket, keyHash]);
    if (n === 20) {
      const { flagAbuse } = require("../audit");
      await flagAbuse(null, { ...subject, reason: "rate_limit_repeat", details: { bucket, blocks: n } });
    }
  } catch { /* never let logging break the request */ }
}

// key(req) returns a raw subject string; it is hashed before storage.
function limit(bucket, keyFn = (req) => `ip:${ipHash(req)}`) {
  return (req, res, next) => {
    const p = { ...POLICIES[bucket], ...(overrides()[bucket] || {}) };
    const raw = keyFn(req);
    if (!raw) return next();
    const r = limiter.take(bucket, raw, p.max, p.windowMs);
    res.setHeader("RateLimit-Remaining", String(r.remaining));
    if (r.ok) return next();
    res.setHeader("Retry-After", String(Math.ceil(r.resetMs / 1000)));
    recordBlock(bucket, hmac(raw, "rl").slice(0, 32), { ipHash: ipHash(req), userId: req.session && req.session.user_id || null });
    return res.status(429).json({ error: { code: "rate_limited", message: "Too many requests. Please slow down and try again shortly." } });
  };
}

// Imperative check for keys only known after parsing the body (e.g. wallet address).
function check(bucket, raw, req) {
  const p = { ...POLICIES[bucket], ...(overrides()[bucket] || {}) };
  const r = limiter.take(bucket, raw, p.max, p.windowMs);
  if (!r.ok) {
    recordBlock(bucket, hmac(raw, "rl").slice(0, 32), { ipHash: ipHash(req) });
    const { UserError } = require("./util");
    throw new UserError(429, "rate_limited", "Too many attempts for this wallet. Please wait a minute and try again.");
  }
}

module.exports = { limit, check, limiter, POLICIES, Limiter };
