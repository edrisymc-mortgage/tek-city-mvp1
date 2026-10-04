"use strict";
// Launchpad: every board space (except Central Station) can hold one Pump.fun coin.
//  - Empty space: launch a coin there (the space becomes that coin).
//  - Space with a coin: grow it (buy in), or take it over by launching a new coin with a first buy
//    at least as large as the biggest single buy-in that coin has had on this space.
// Players sign everything in their own wallet. The server only builds, verifies, relays, and records.
const express = require("express");
const crypto = require("crypto");
const db = require("../db/pool");
const sessions = require("../auth/sessions");
const { STOPS, RULES } = require("../game/board");
const { normalizeAddress } = require("../auth/address");
const { limit } = require("../security/rateLimit");
const v = require("../security/validate");
const { fail, ipHash } = require("../security/util");
const { audit, activity } = require("../audit");
const pump = require("../chain/pump");
const sol = require("../chain/solana");
const rewards = require("../chain/rewards");
const spins = require("../game/spins");
const milestones = require("../game/milestones");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const userKey = (req) => `u:${req.session.user_id}`;
const ipKey = (req) => `ip:${ipHash(req)}`;
const sol9 = (l) => (Number(l) / 1e9).toFixed(3).replace(/\.?0+$/, "");
const COIN_STOPS = new Set(STOPS.map((s, i) => (s.type === "station" ? null : i)).filter((x) => x !== null));
const MAGIC = [["image/png", [0x89, 0x50, 0x4e, 0x47]], ["image/jpeg", [0xff, 0xd8, 0xff]], ["image/gif", [0x47, 0x49, 0x46]], ["image/webp", [0x52, 0x49, 0x46, 0x46]]];

function build(config, { notify }) {
  const r = express.Router();
  const L = config.launchpad;

  async function ctx(req, stopId) {
    if (!L.enabled) fail(403, "feature_disabled", "The launchpad is turned off right now.");
    if (!COIN_STOPS.has(stopId)) fail(400, "bad_space", "Coins can't be launched on Central Station.");
    const uid = req.session.user_id;
    const w = (await db.query(`SELECT address FROM wallet_accounts WHERE user_id = $1 AND unlinked_at IS NULL LIMIT 1`, [uid])).rows[0];
    if (!w) fail(403, "wallet_required", "Link your Phantom wallet first. Launching and growing coins happen in your own wallet.");
    const p = (await db.query(`SELECT position FROM player_resources WHERE user_id = $1`, [uid])).rows[0];
    if (!p || p.position !== stopId) fail(409, "not_on_space", "Land on this space first. Roll to move around the board.");
    const coin = (await db.query(`SELECT * FROM space_coins WHERE stop_id = $1`, [stopId])).rows[0] || null;
    const name = (await db.query(`SELECT display_name FROM users WHERE id = $1`, [uid])).rows[0].display_name;
    return { uid, wallet: w.address, coin, name };
  }
  async function intent(c, kind, stopId, mint, lamports, built, meta = {}, image = null) {
    const id = crypto.randomBytes(16).toString("hex");
    await db.query(`INSERT INTO coin_intents (id, user_id, wallet, kind, stop_id, mint, lamports, meta, tx_b64, image_bytes, expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, now() + interval '3 minutes')`,
      [id, c.uid, c.wallet, kind, stopId, mint, lamports, JSON.stringify(meta), built.transaction, image]);
    return id;
  }
  const amount = (lamports) => {
    if (lamports < L.minBuyLamports) fail(400, "too_small", `Minimum is ${sol9(L.minBuyLamports)} SOL.`);
    if (lamports > L.maxBuyLamports) fail(400, "too_large", `Maximum is ${sol9(L.maxBuyLamports)} SOL per transaction.`);
    return lamports;
  };

  r.get("/launchpad/info", limit("api_read", ipKey), wrap(async (_req, res) => {
    res.json({
      enabled: L.enabled, minBuyLamports: L.minBuyLamports, maxBuyLamports: L.maxBuyLamports, launcherBps: L.launcherBps,
      split: !!rewards.poolAddress(), ready: { images: !!config.launchpad.pinataJwt, token: !!config.spins.mint }, spinToken: config.spins.mint || null, tokensPerSpin: config.spins.tokensPerSpin,
      rewards: await rewards.summary(),
      milestones: await milestones.summary(),
      coins: (await db.query(`SELECT COUNT(*)::int AS n, COALESCE(SUM(grown_lamports),0)::bigint AS l FROM space_coins`)).rows[0],
      spaces: COIN_STOPS.size,
    });
  }));

  r.get("/coin-img/:stop", limit("api_read", ipKey), wrap(async (req, res) => {
    const id = Number(req.params.stop);
    const row = Number.isInteger(id) ? (await db.query(`SELECT image_bytes, image_mime FROM space_coins WHERE stop_id = $1`, [id])).rows[0] : null;
    if (!row || !row.image_bytes) return res.status(404).end();
    res.setHeader("Content-Type", row.image_mime); res.setHeader("Cache-Control", "public, max-age=300"); res.setHeader("X-Content-Type-Options", "nosniff");
    res.end(row.image_bytes);
  }));

  r.use(sessions.csrf);

  // ------------------------------------------------------------ launch (empty space or takeover)
  r.post("/launchpad/launch", sessions.requireUser, limit("game_action_user", userKey), wrap(async (req, res) => {
    const b = v.obj(req.body, {
      stopId: { type: "int", min: 0, max: 23 },
      name: { type: "string", min: 2, max: 32, pattern: /^[\p{L}\p{N} .,'!&$-]+$/u },
      symbol: { type: "string", min: 2, max: 10, pattern: /^[A-Za-z0-9]+$/ },
      description: { type: "string", max: 280, optional: true },
      website: { type: "string", max: 200, optional: true, pattern: /^https:\/\/[^\s<>"]+$/ },
      twitter: { type: "string", max: 200, optional: true, pattern: /^https:\/\/(x|twitter)\.com\/[^\s<>"]+$/ },
      image: { type: "string", min: 20, max: 2_100_000, trim: false },
      lamports: { type: "int", min: 1, max: 100_000_000_000 },
    });
    const c = await ctx(req, b.stopId);
    const lamports = amount(b.lamports);
    if (c.coin) {
      const need = Math.max(Number(c.coin.top_buy_lamports), Number(c.coin.launch_lamports));
      if (lamports < need) fail(409, "takeover_price", `To take over $${c.coin.symbol}'s space, your first buy must be at least ${sol9(need)} SOL. Or grow $${c.coin.symbol} instead.`);
    }
    const m = /^data:(image\/(png|jpeg|gif|webp));base64,([A-Za-z0-9+/=]+)$/.exec(b.image);
    if (!m) fail(400, "bad_image", "Upload a PNG, JPG, GIF, or WebP image.");
    const img = Buffer.from(m[3], "base64");
    if (img.length > 1_500_000) fail(400, "bad_image", "Image must be under 1.5 MB.");
    const sniff = MAGIC.find(([, sig]) => sig.every((x, i) => img[i] === x));
    if (!sniff || sniff[0] !== m[1]) fail(400, "bad_image", "That file isn't a valid image.");
    const symbol = b.symbol.toUpperCase();
    const { uri, imageUri } = await pump.uploadMetadata({ image: img, mime: m[1], name: b.name, symbol, description: b.description || `${b.name} launched on TEK CITY.`, website: b.website, twitter: b.twitter });
    const built = await pump.createCoin({ wallet: c.wallet, name: b.name, symbol, uri, lamports });
    const mint = normalizeAddress(built.mintPublicKey);
    if (!mint) fail(502, "pump_error", "Pump.fun returned an invalid coin address.");
    const id = await intent(c, "launch", b.stopId, mint, lamports, built, { name: b.name, symbol, uri, imageUri, mime: m[1], takeover: c.coin ? c.coin.mint : null }, img);
    res.json({ intentId: id, transaction: built.transaction, mint, takeover: !!c.coin });
  }));

  // ------------------------------------------------------------ grow (buy in)
  r.post("/launchpad/grow", sessions.requireUser, limit("game_action_user", userKey), wrap(async (req, res) => {
    const b = v.obj(req.body, { stopId: { type: "int", min: 0, max: 23 }, lamports: { type: "int", min: 1, max: 100_000_000_000 } });
    const c = await ctx(req, b.stopId);
    if (!c.coin) fail(409, "no_coin", "No coin here yet. Launch one.");
    if (rewards.poolAddress() && !c.coin.split_done) fail(409, "split_pending", `$${c.coin.symbol} is finishing setup. Its launcher needs to confirm the community fee split first.`);
    const lamports = amount(b.lamports);
    const built = await pump.buy({ wallet: c.wallet, mint: c.coin.mint, lamports });
    const id = await intent(c, "grow", b.stopId, c.coin.mint, lamports, built, { symbol: c.coin.symbol });
    res.json({ intentId: id, transaction: built.transaction });
  }));

  // ------------------------------------------------------------ community fee split (launcher only)
  async function prepareSplit(c, stopId, coin) {
    const pool = rewards.poolAddress();
    if (!pool) return null;
    const shareholders = pool === c.wallet ? [{ address: c.wallet, bps: 10000 }]
      : [{ address: c.wallet, bps: L.launcherBps }, { address: pool, bps: 10000 - L.launcherBps }];
    const built = await pump.sharingConfig({ wallet: c.wallet, mint: coin.mint, shareholders });
    return { intentId: await intent(c, "split", stopId, coin.mint, 0, built), transaction: built.transaction };
  }
  r.post("/launchpad/split", sessions.requireUser, limit("game_action_user", userKey), wrap(async (req, res) => {
    const b = v.obj(req.body, { stopId: { type: "int", min: 0, max: 23 } });
    const uid = req.session.user_id;
    const coin = (await db.query(`SELECT * FROM space_coins WHERE stop_id = $1`, [b.stopId])).rows[0];
    if (!coin || coin.launcher_user_id !== uid) fail(403, "not_launcher", "Only this coin's launcher can confirm its fee split.");
    if (coin.split_done) fail(409, "done", "Already set up.");
    const out = await prepareSplit({ uid, wallet: coin.launcher_wallet }, b.stopId, coin);
    if (!out) fail(409, "no_pool", "No community rewards wallet is configured.");
    res.json(out);
  }));

  // ------------------------------------------------------------ submit a wallet-signed transaction
  r.post("/launchpad/submit", sessions.requireUser, limit("game_action_user", userKey), wrap(async (req, res) => {
    const b = v.obj(req.body, { intentId: { type: "string", min: 32, max: 32, pattern: /^[a-f0-9]{32}$/ }, signedTx: { type: "string", min: 100, max: 4000, trim: false } });
    const uid = req.session.user_id;
    const it = (await db.query(`UPDATE coin_intents SET used = true WHERE id = $1 AND user_id = $2 AND NOT used AND expires_at > now() RETURNING *`, [b.intentId, uid])).rows[0];
    if (!it) fail(410, "intent_expired", "That request expired. Start again.");
    sol.verifySigned(it.tx_b64, b.signedTx, it.wallet);
    const sig = await sol.sendAndConfirm(b.signedTx);
    const t = await sol.getTx(sig);
    const fx = sol.effects(t, it.wallet, it.mint);
    if (!fx.ok) fail(409, "tx_failed", "The transaction failed on Solana.");
    const user = (await db.query(`SELECT display_name FROM users WHERE id = $1`, [uid])).rows[0];
    const round = (await db.query(`SELECT id FROM game_rounds WHERE status = 'open' ORDER BY id DESC LIMIT 1`)).rows[0];
    const meta = it.meta || {};
    let out = { ok: true, signature: sig, kind: it.kind };

    if (it.kind === "launch") {
      if (!fx.keys.includes(it.mint)) fail(409, "tx_mismatch", "That transaction didn't create the expected coin.");
      const placed = await db.tx(async (c) => {
        const cur = (await c.query(`SELECT * FROM space_coins WHERE stop_id = $1 FOR UPDATE`, [it.stop_id])).rows[0];
        if (cur && cur.mint !== meta.takeover) return false; // someone else changed the space meanwhile
        if (cur && Number(it.lamports) < Math.max(Number(cur.top_buy_lamports), Number(cur.launch_lamports))) return false;
        if (cur) {
          await c.query(`INSERT INTO space_coin_history (stop_id, mint, symbol, launcher_wallet, grown_lamports, replaced_by) VALUES ($1,$2,$3,$4,$5,$6)`, [cur.stop_id, cur.mint, cur.symbol, cur.launcher_wallet, cur.grown_lamports, it.mint]);
          await c.query(`DELETE FROM space_coins WHERE stop_id = $1`, [it.stop_id]);
        }
        await c.query(`INSERT INTO space_coins (stop_id, mint, name, symbol, image_url, metadata_uri, image_bytes, image_mime, launcher_user_id, launcher_wallet, launch_sig, launch_lamports, top_buy_lamports, grown_lamports, split_done)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$12,$13)`,
          [it.stop_id, it.mint, meta.name, meta.symbol, meta.imageUri, meta.uri, it.image_bytes, meta.mime, uid, it.wallet, sig, it.lamports, !rewards.poolAddress()]);
        await c.query(`INSERT INTO coin_txs (signature, kind, user_id, wallet, stop_id, mint, lamports, round_id) VALUES ($1,'launch',$2,$3,$4,$5,$6,$7)`, [sig, uid, it.wallet, it.stop_id, it.mint, it.lamports, round && round.id]);
        await addXp(c, it.stop_id, it.lamports);
        await activity(c, "launch", `${user.display_name} launched $${meta.symbol} on ${STOPS[it.stop_id].name}${cur ? `, taking the space from $${cur.symbol}` : ""}.`);
        return true;
      });
      out.placed = placed;
      out.message = placed ? `$${meta.symbol} is live on Pump.fun and now owns this space.` : `$${meta.symbol} launched on Pump.fun, but someone changed this space first, so it wasn't placed on the board.`;
      if (placed) {
        const coin = (await db.query(`SELECT * FROM space_coins WHERE stop_id = $1`, [it.stop_id])).rows[0];
        out.next = await prepareSplit({ uid, wallet: it.wallet }, it.stop_id, coin).catch(() => null);
      }
    } else if (it.kind === "grow") {
      if (!(fx.tokensGained > 0)) fail(409, "tx_mismatch", "That transaction didn't buy the expected coin.");
      if (fx.spentLamports > Number(it.lamports) + 30_000_000) fail(409, "tx_mismatch", "That transaction spent more than expected.");
      await db.tx(async (c) => {
        await c.query(`INSERT INTO coin_txs (signature, kind, user_id, wallet, stop_id, mint, lamports, round_id) VALUES ($1,'grow',$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`, [sig, uid, it.wallet, it.stop_id, it.mint, it.lamports, round && round.id]);
        await c.query(`UPDATE space_coins SET grown_lamports = grown_lamports + $2, grow_count = grow_count + 1, top_buy_lamports = GREATEST(top_buy_lamports, $2) WHERE stop_id = $1 AND mint = $3`, [it.stop_id, it.lamports, it.mint]);
        await addXp(c, it.stop_id, it.lamports);
        await activity(c, "grow", `${user.display_name} grew $${meta.symbol} with ${sol9(it.lamports)} SOL on ${STOPS[it.stop_id].name}.`);
      });
      out.message = `You bought into $${meta.symbol} with ${sol9(it.lamports)} SOL. The space grew.`;
    } else {
      await db.query(`UPDATE space_coins SET split_done = true, split_sig = $2 WHERE stop_id = $1 AND mint = $3`, [it.stop_id, sig, it.mint]);
      out.message = "Fee split confirmed. 80% of creator fees go to you, 20% to TEK CITY community rewards.";
    }
    await audit(null, { actorUserId: uid, actorWallet: it.wallet, action: `launchpad.${it.kind}`, target: it.mint, details: { stop: it.stop_id, lamports: Number(it.lamports), tx: sig }, ipHash: ipHash(req) });
    spins.bust(it.wallet);
    notify();
    res.json(out);
  }));

  async function addXp(c, stopId, lamports) {
    if (STOPS[stopId].type !== "district") return;
    const xp = Math.max(1, Math.round((Number(lamports) / 1e9) * L.xpPerSol));
    await c.query(`UPDATE districts SET xp = xp + $2, xp_total = xp_total + $2, updated_at = now() WHERE id = $1 AND level < $3`, [stopId, xp, RULES.maxLevel]);
  }

  return r;
}

module.exports = { build };
