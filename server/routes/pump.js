"use strict";
// pump.fun profile linking. pump.fun has no OAuth, so ownership is proven one of two ways:
//  1. The player's linked Phantom/Solana wallet IS their pump.fun wallet (proven by the wallet signature at sign-in), or
//  2. The player puts a one-time code in their pump.fun bio (works for pump.fun's built-in email/social wallets).
// A verified pump.fun wallet counts toward spins (its TEK CITY buys) and shows the player's pump.fun profile and coins.
const express = require("express");
const crypto = require("crypto");
const db = require("../db/pool");
const sessions = require("../auth/sessions");
const { normalizeAddress } = require("../auth/address");
const { limit } = require("../security/rateLimit");
const { fail, ipHash } = require("../security/util");
const { audit } = require("../audit");
const spins = require("../game/spins");

const API = "https://frontend-api-v3.pump.fun";
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const userKey = (req) => `u:${req.session.user_id}`;
const cache = new Map();

async function pf(path, ttl = 60e3) {
  const hit = cache.get(path);
  if (hit && Date.now() - hit.at < ttl) return hit.v;
  let v = null;
  try {
    const res = await fetch(API + path, { headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (TEK CITY)", origin: "https://pump.fun" }, signal: AbortSignal.timeout(8000) });
    if (res.status === 404) v = null;
    else if (!res.ok) fail(502, "pump_unavailable", "pump.fun didn't respond. Try again in a minute.");
    else v = await res.json();
  } catch (e) { if (e.status) throw e; fail(502, "pump_unavailable", "pump.fun didn't respond. Try again in a minute."); }
  cache.set(path, { at: Date.now(), v });
  return v;
}
const profile = (addr, ttl) => pf(`/users/${addr}`, ttl);
async function coinsBy(addr) {
  const list = await pf(`/coins?offset=0&limit=24&sort=created_timestamp&order=DESC&creator=${addr}&includeNsfw=false`).catch(() => []);
  return (Array.isArray(list) ? list : []).filter((c) => c.creator === addr).slice(0, 12).map((c) => ({
    mint: c.mint, name: String(c.name || "").slice(0, 40), symbol: String(c.symbol || "").slice(0, 12),
    image: /^https:\/\//.test(c.image_uri || "") ? c.image_uri : null, marketCapUsd: Math.round(Number(c.usd_market_cap) || 0),
    complete: !!c.complete, url: `https://pump.fun/coin/${c.mint}`,
  }));
}
const pub = (p, address, via) => p && ({
  address, via, username: String(p.username || "").slice(0, 40) || null,
  avatar: /^https:\/\//.test(p.profile_image || "") ? p.profile_image : null,
  followers: Number(p.followers) || 0, url: `https://pump.fun/profile/${address}`,
});

function build() {
  const r = express.Router();
  r.use(sessions.csrf);

  r.get("/pump/me", sessions.requireUser, limit("api_read", userKey), wrap(async (req, res) => {
    const uid = req.session.user_id;
    const link = (await db.query(`SELECT * FROM pump_links WHERE user_id = $1`, [uid])).rows[0];
    if (link && link.verified_at) {
      const p = await profile(link.address).catch(() => null);
      return res.json({ linked: true, profile: pub(p || { username: link.username, profile_image: link.avatar }, link.address, "bio"), coins: await coinsBy(link.address) });
    }
    const w = (await db.query(`SELECT address FROM wallet_accounts WHERE user_id = $1 AND unlinked_at IS NULL LIMIT 1`, [uid])).rows[0];
    if (w) {
      const p = await profile(w.address).catch(() => null);
      if (p) return res.json({ linked: true, profile: pub(p, w.address, "wallet"), coins: await coinsBy(w.address) });
    }
    res.json({ linked: false, pending: link ? { address: link.address, code: link.code } : null });
  }));

  r.post("/pump/link/start", sessions.requireUser, limit("game_action_user", userKey), wrap(async (req, res) => {
    const raw = String((req.body && req.body.address) || "").trim();
    const m = raw.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/);
    const address = m && normalizeAddress(m[0]);
    if (!address) fail(400, "bad_address", "Paste your pump.fun profile link or wallet address.");
    const p = await profile(address, 0);
    if (!p) fail(404, "no_profile", "No pump.fun profile at that address. Open pump.fun, go to your profile, and copy the link.");
    const taken = (await db.query(`SELECT user_id FROM pump_links WHERE address = $1 AND verified_at IS NOT NULL`, [address])).rows[0];
    if (taken && taken.user_id !== req.session.user_id) fail(409, "taken", "That pump.fun profile is already linked to another player.");
    const code = `TEKCITY-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    await db.query(
      `INSERT INTO pump_links (user_id, address, code) VALUES ($1,$2,$3)
       ON CONFLICT (user_id) DO UPDATE SET address = EXCLUDED.address, code = EXCLUDED.code, verified_at = NULL, created_at = now()`,
      [req.session.user_id, address, code]).catch((e) => { if (e.code === "23505") fail(409, "taken", "That pump.fun profile is already linked to another player."); throw e; });
    res.json({ address, code, username: p.username || null });
  }));

  r.post("/pump/link/verify", sessions.requireUser, limit("game_action_user", userKey), wrap(async (req, res) => {
    const uid = req.session.user_id;
    const link = (await db.query(`SELECT * FROM pump_links WHERE user_id = $1`, [uid])).rows[0];
    if (!link) fail(404, "no_link", "Start by pasting your pump.fun profile link.");
    const p = await profile(link.address, 0);
    if (!p || !String(p.bio || "").toUpperCase().includes(link.code)) fail(409, "code_missing", `We couldn't find ${link.code} in your pump.fun bio yet. Save your profile on pump.fun, then try again.`);
    await db.query(`UPDATE pump_links SET verified_at = now(), username = $2, avatar = $3 WHERE user_id = $1`, [uid, p.username || null, p.profile_image || null]);
    spins.bust(link.address);
    await audit(null, { actorUserId: uid, action: "pump_linked", target: link.address, ipHash: ipHash(req) }).catch(() => {});
    res.json({ ok: true, profile: pub(p, link.address, "bio"), coins: await coinsBy(link.address) });
  }));

  r.post("/pump/unlink", sessions.requireUser, limit("game_action_user", userKey), wrap(async (req, res) => {
    await db.query(`DELETE FROM pump_links WHERE user_id = $1`, [req.session.user_id]);
    res.json({ ok: true });
  }));

  return r;
}

module.exports = { build };
