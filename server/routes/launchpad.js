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
const spins = require("../game/spins");
const milestones = require("../game/milestones");

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const userKey = (req) => `u:${req.session.user_id}`;
const ipKey = (req) => `ip:${ipHash(req)}`;
const sol9 = (l) => (Number(l) / 1e9).toFixed(3).replace(/\.?0+$/, "");
const COIN_STOPS = new Set(STOPS.map((s, i) => (s.type === "station" ? null : i)).filter((x) => x !== null));
const MAGIC = [["image/png", [0x89, 0x50, 0x4e, 0x47]], ["image/jpeg", [0xff, 0xd8, 0xff]], ["image/gif", [0x47, 0x49, 0x46]], ["image/webp", [0x52, 0x49, 0x46, 0x46]]];

function build(config, { notify, noScheduler = false }) {
  const r = express.Router();
  const L = config.launchpad;

  async function ctx(req, stopId) {
    if (!L.enabled) fail(403, "feature_disabled", "The launchpad is turned off right now.");
    if (!COIN_STOPS.has(stopId)) fail(400, "bad_space", "Coins can't be launched on Central Station.");
    const uid = req.session.user_id;
    const w = (await db.query(`SELECT address FROM wallet_accounts WHERE user_id = $1 AND unlinked_at IS NULL LIMIT 1`, [uid])).rows[0];
    if (!w) fail(403, "wallet_required", "Connect a Solana wallet first. Launching and buying coins happen in your own wallet.");
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

  // Check the wallet can cover the amount plus fees and rent BEFORE building anything.
  async function funds(wallet, lamports, reserve) {
    const bal = await sol.solBalance(wallet);
    if (bal < lamports + reserve) fail(402, "insufficient_sol", `Not enough SOL. You need about ${sol9(lamports + reserve)} SOL (${sol9(lamports)} + up to ${sol9(reserve)} for network fees and account rent). This wallet has ${sol9(bal)} SOL.`);
    return bal;
  }
  // TEK CITY never takes a cut of a player's launch or buy: refuse any transaction that touches a TEK CITY wallet.
  const tekWallets = () => [config.communityFund.operatorWallet, config.communityFund.treasuryWallet, ...(config.launchpad.blockedRecipients || [])].filter(Boolean);
  function reviewFor(action, built, c, { lamports, reserve, balance, symbol, name, mint, imageUrl }) {
    const rv = sol.review(built.transaction);
    if (rv.payer !== c.wallet) fail(502, "pump_error", "Pump.fun built a transaction for the wrong wallet. Nothing was sent.");
    const hit = tekWallets().find((w) => rv.accounts.includes(w));
    if (hit) fail(502, "pump_error", "This transaction would involve a TEK CITY wallet. TEK CITY never receives launch or buy payments, so it was refused. Nothing was sent.");
    return {
      action, launchpad: "Pump.fun", network: config.solana.network, payer: rv.payer, symbol, name, mint, imageUrl: imageUrl || null,
      lamports, feeLamports: rv.feeLamports, reserveLamports: reserve, maxTotalLamports: lamports + rv.feeLamports + reserve, balanceLamports: balance,
      fees: [
        { label: action === "buy" ? "Buy amount (sent to the Pump.fun bonding curve)" : "First buy (sent to the Pump.fun bonding curve)", lamports, kind: "amount" },
        { label: "Pump.fun trading fee", note: "Taken from the buy amount under Pump.fun's current fee schedule", kind: "included" },
        ...(action !== "buy" ? [{ label: "Coin creation on Pump.fun", note: "No separate creation fee is in this transaction", kind: "info" }] : []),
        { label: "Solana network fee (estimated)", lamports: rv.feeLamports, kind: "fee" },
        { label: action === "buy" ? "Token account rent (only if you don't hold this coin yet)" : "Account rent (mint, metadata, bonding curve, token account)", lamports: reserve, kind: "max" },
        { label: "TEK CITY fee", lamports: 0, kind: "zero" },
      ],
      programs: rv.programs, transfers: rv.transfers, lookupTables: rv.lookupTables, expiresInSec: 180,
    };
  }

  r.get("/launchpad/info", limit("api_read", ipKey), wrap(async (_req, res) => {
    res.json({
      enabled: L.enabled, minBuyLamports: L.minBuyLamports, maxBuyLamports: L.maxBuyLamports, bioLink: !!L.pumpBioLink,
      ready: { images: !!config.launchpad.pinataJwt, token: !!config.spins.mint }, spinToken: config.spins.mint || null, tokensPerSpin: config.spins.tokensPerSpin,
      communityFund: await require("../chain/creatorRewards").publicSummary(),
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
  r.post("/launchpad/launch", sessions.requireUser, limit("coin_create", userKey), wrap(async (req, res) => {
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
    const balance = await funds(c.wallet, lamports, L.launchReserveLamports);
    const { uri, imageUri } = await pump.uploadMetadata({ image: img, mime: m[1], name: b.name, symbol, description: b.description || `${b.name} launched on TEK CITY.`, website: b.website, twitter: b.twitter });
    const built = await pump.createCoin({ wallet: c.wallet, name: b.name, symbol, uri, lamports });
    const mint = normalizeAddress(built.mintPublicKey);
    if (!mint) fail(502, "pump_error", "Pump.fun returned an invalid coin address.");
    const id = await intent(c, "launch", b.stopId, mint, lamports, built, { name: b.name, symbol, uri, imageUri, mime: m[1], takeover: c.coin ? c.coin.mint : null }, img);
    await db.query(`INSERT INTO coin_launches (intent_id, user_id, creator_wallet, mint, name, symbol, description, metadata_uri, image_url, stop_id, first_buy_lamports) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, c.uid, c.wallet, mint, b.name, symbol, b.description || null, uri, imageUri, b.stopId, lamports]);
    res.json({ intentId: id, transaction: built.transaction, mint, takeover: !!c.coin, review: reviewFor(c.coin ? "takeover" : "launch", built, c, { lamports, reserve: L.launchReserveLamports, balance, symbol, name: b.name, mint, imageUrl: imageUri }) });
  }));

  // ------------------------------------------------------------ grow (buy in)
  r.post("/launchpad/grow", sessions.requireUser, limit("purchase_init", userKey), wrap(async (req, res) => {
    const b = v.obj(req.body, { stopId: { type: "int", min: 0, max: 23 }, lamports: { type: "int", min: 1, max: 100_000_000_000 } });
    const c = await ctx(req, b.stopId);
    if (!c.coin) fail(409, "no_coin", "No coin here yet. Launch one.");
    const lamports = amount(b.lamports);
    const balance = await funds(c.wallet, lamports, L.buyReserveLamports);
    const built = await pump.buy({ wallet: c.wallet, mint: c.coin.mint, lamports });
    const id = await intent(c, "grow", b.stopId, c.coin.mint, lamports, built, { symbol: c.coin.symbol });
    res.json({ intentId: id, transaction: built.transaction, review: reviewFor("buy", built, c, { lamports, reserve: L.buyReserveLamports, balance, symbol: c.coin.symbol, name: c.coin.name, mint: c.coin.mint }) });
  }));

  // Retired: TEK CITY no longer sets a fee split on players' coins. Creator rewards on a player's coin belong to that player.
  r.post("/launchpad/split", sessions.requireUser, (_req, _res, next) => next(new (require("../security/util").UserError)(410, "retired", "Fee splits are retired. Creator rewards on your coin stay with your wallet under Pump.fun's rules.")));

  // ------------------------------------------------------------ submit a wallet-signed transaction
  // Order matters for idempotency:
  //   1. verify the signed tx is exactly what we built, signed by the session's wallet
  //   2. record its signature in chain_tx_processing (primary key) BEFORE sending
  //   3. send, wait for "confirmed", re-read it from the chain and check its effects
  //   4. settle game state in one DB transaction guarded by that row's status
  // Re-submitting or re-checking the same signature can never settle twice.
  r.post("/launchpad/submit", sessions.requireUser, limit("tx_submit", userKey), wrap(async (req, res) => {
    const b = v.obj(req.body, { intentId: { type: "string", min: 32, max: 32, pattern: /^[a-f0-9]{32}$/ }, signedTx: { type: "string", min: 100, max: 4000, trim: false } });
    const uid = req.session.user_id;
    const it = (await db.query(`SELECT * FROM coin_intents WHERE id = $1 AND user_id = $2`, [b.intentId, uid])).rows[0];
    if (!it) fail(404, "intent_missing", "That request wasn't found. Start again.");
    const prior = (await db.query(`SELECT * FROM chain_tx_processing WHERE intent_id = $1`, [it.id])).rows[0];
    if (prior) return res.json(await settle(req, it, prior.signature));
    if (it.used || new Date(it.expires_at) <= new Date()) fail(410, "intent_expired", "That request expired before it was signed. Nothing was sent. Start again.");
    const signed = sol.verifySigned(it.tx_b64, b.signedTx, it.wallet);
    const sig = sol.sigOf(signed);
    const ins = await db.tx(async (c) => {
      const u = (await c.query(`UPDATE coin_intents SET used = true WHERE id = $1 AND NOT used RETURNING id`, [it.id])).rows[0];
      if (!u) return false;
      await c.query(`INSERT INTO chain_tx_processing (signature, intent_id, kind, user_id, wallet, mint, stop_id, lamports, blockhash, network) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [sig, it.id, it.kind, uid, it.wallet, it.mint, it.stop_id, it.lamports, signed.message.recentBlockhash, config.solana.network]);
      if (it.kind === "launch") await c.query(`UPDATE coin_launches SET status = 'submitted', signature = $2, updated_at = now() WHERE intent_id = $1`, [it.id, sig]);
      return true;
    });
    if (!ins) { const p2 = (await db.query(`SELECT signature FROM chain_tx_processing WHERE intent_id = $1`, [it.id])).rows[0]; if (p2) return res.json(await settle(req, it, p2.signature)); fail(409, "busy", "That request is already being processed."); }
    try { await sol.send(b.signedTx); }
    catch (e) {
      // Preflight rejected it (e.g. insufficient funds, slippage). Check the chain didn't take it anyway, then mark failed.
      const st = await sol.sigStatus(sig).catch(() => ({ state: "unknown" }));
      if (st.state === "unknown" || st.state === "failed") { await markFailed(it, sig, "failed", e.message); fail(409, "tx_failed", `Solana rejected the transaction. Nothing was charged. ${String(e.message).replace(/^Solana network error:?\s*/, "").slice(0, 160)}`); }
    }
    const st = await sol.waitFor(sig, 60e3);
    if (st.state === "timeout") {
      await db.query(`UPDATE chain_tx_processing SET status = 'timeout', attempts = attempts + 1, updated_at = now() WHERE signature = $1 AND status = 'submitted'`, [sig]);
      return res.status(202).json({ ok: false, pending: true, signature: sig, kind: it.kind, message: "Sent. Solana hasn't confirmed it yet. We'll keep checking. Nothing is credited until it confirms." });
    }
    res.json(await settle(req, it, sig, st));
  }));

  // Re-check a transaction that timed out (or any of yours). Safe to call any number of times.
  r.post("/launchpad/recheck", sessions.requireUser, limit("tx_submit", userKey), wrap(async (req, res) => {
    const b = v.obj(req.body, { signature: { type: "string", min: 64, max: 90, pattern: /^[1-9A-HJ-NP-Za-km-z]+$/ } });
    const row = (await db.query(`SELECT * FROM chain_tx_processing WHERE signature = $1 AND user_id = $2`, [b.signature, req.session.user_id])).rows[0];
    if (!row) fail(404, "unknown_tx", "No transaction with that signature on your account.");
    const it = (await db.query(`SELECT * FROM coin_intents WHERE id = $1`, [row.intent_id])).rows[0];
    res.json(await settle(req, it, row.signature));
  }));
  r.get("/launchpad/txs", sessions.requireUser, limit("api_read", userKey), wrap(async (req, res) => {
    const rows = (await db.query(`SELECT signature, kind, mint, stop_id, lamports, status, error_message, created_at, processed_at FROM chain_tx_processing WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [req.session.user_id])).rows;
    res.json({ txs: rows.map((x) => ({ ...x, lamports: Number(x.lamports) })) });
  }));

  async function markFailed(it, sig, status, msg) {
    await db.query(`UPDATE chain_tx_processing SET status = $2, error_message = $3, updated_at = now(), processed_at = now() WHERE signature = $1 AND status IN ('submitted','timeout')`, [sig, status, String(msg || "").slice(0, 300)]);
    if (it && it.kind === "launch") await db.query(`UPDATE coin_launches SET status = $2, error_message = $3, updated_at = now(), processed_at = now() WHERE intent_id = $1`, [it.id, status, String(msg || "").slice(0, 300)]);
  }

  // Settle one signature. Returns the response body. Never credits a transaction twice.
  async function settle(req, it, sig, known) {
    const row = (await db.query(`SELECT * FROM chain_tx_processing WHERE signature = $1`, [sig])).rows[0];
    const base = { signature: sig, kind: it.kind };
    if (row.status === "settled") return { ...base, ok: true, already: true, message: "Already confirmed and recorded." };
    if (row.status === "failed" || row.status === "expired") return { ...base, ok: false, status: row.status, message: row.status === "expired" ? "This transaction expired before Solana confirmed it. Nothing was charged or credited." : "This transaction failed on Solana. Nothing was credited." };
    const st = known || (await sol.sigStatus(sig));
    if (st.state === "failed") { await markFailed(it, sig, "failed", JSON.stringify(st.err)); return { ...base, ok: false, status: "failed", message: "The transaction failed on Solana. Nothing was credited." }; }
    if (st.state !== "confirmed" && st.state !== "finalized") {
      if (row.blockhash && !(await sol.blockhashValid(row.blockhash).catch(() => true))) {
        const again = await sol.sigStatus(sig);
        if (again.state === "unknown") { await markFailed(it, sig, "expired", "blockhash expired before confirmation"); return { ...base, ok: false, status: "expired", message: "This transaction expired before Solana confirmed it. Nothing was charged or credited." }; }
      }
      return { ...base, ok: false, pending: true, status: row.status, message: "Still waiting for Solana to confirm." };
    }
    const t = await sol.getTx(sig);
    const fx = sol.effects(t, it.wallet, it.mint);
    if (!fx.ok) { await markFailed(it, sig, "failed", "transaction error on chain"); return { ...base, ok: false, status: "failed", message: "The transaction failed on Solana. Nothing was credited." }; }
    if (fx.keys[0] !== it.wallet) { await markFailed(it, sig, "failed", "fee payer mismatch"); fail(409, "tx_mismatch", "That transaction wasn't paid by your wallet."); }
    const uid = it.user_id;
    const user = (await db.query(`SELECT display_name FROM users WHERE id = $1`, [uid])).rows[0] || { display_name: "Player" };
    const round = (await db.query(`SELECT id FROM game_rounds WHERE status = 'open' ORDER BY id DESC LIMIT 1`)).rows[0];
    const meta = it.meta || {};
    const out = { ...base, ok: true };
    const sp = STOPS[it.stop_id] ? (STOPS[it.stop_id].type === "vault" ? "the Vault" : `space ${String(it.stop_id).padStart(2, "0")}`) : "the board";

    if (it.kind === "launch") {
      if (!fx.keys.includes(it.mint)) { await markFailed(it, sig, "failed", "mint not in transaction"); fail(409, "tx_mismatch", "That transaction didn't create the expected coin."); }
      const placed = await db.tx(async (c) => {
        const claim = (await c.query(`UPDATE chain_tx_processing SET status = 'settled', updated_at = now(), processed_at = now() WHERE signature = $1 AND status IN ('submitted','timeout','confirmed') RETURNING 1`, [sig])).rows[0];
        if (!claim) return null; // settled concurrently
        const cur = (await c.query(`SELECT * FROM space_coins WHERE stop_id = $1 FOR UPDATE`, [it.stop_id])).rows[0];
        let ok = true;
        if (cur && cur.mint !== meta.takeover) ok = false;
        if (cur && ok && Number(it.lamports) < Math.max(Number(cur.top_buy_lamports), Number(cur.launch_lamports))) ok = false;
        if (ok) {
          if (cur) {
            await c.query(`INSERT INTO space_coin_history (stop_id, mint, symbol, launcher_wallet, grown_lamports, replaced_by) VALUES ($1,$2,$3,$4,$5,$6)`, [cur.stop_id, cur.mint, cur.symbol, cur.launcher_wallet, cur.grown_lamports, it.mint]);
            await c.query(`DELETE FROM space_coins WHERE stop_id = $1`, [it.stop_id]);
          }
          await c.query(`INSERT INTO space_coins (stop_id, mint, name, symbol, image_url, metadata_uri, image_bytes, image_mime, launcher_user_id, launcher_wallet, launch_sig, launch_lamports, top_buy_lamports, grown_lamports, split_done)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$12,$12,$13)`,
            [it.stop_id, it.mint, meta.name, meta.symbol, meta.imageUri, meta.uri, it.image_bytes, meta.mime, uid, it.wallet, sig, it.lamports, true]);
          await c.query(`INSERT INTO coin_txs (signature, kind, user_id, wallet, stop_id, mint, lamports, round_id) VALUES ($1,'launch',$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`, [sig, uid, it.wallet, it.stop_id, it.mint, it.lamports, round && round.id]);
          await addXp(c, it.stop_id, it.lamports);
          await activity(c, "launch", `${user.display_name} launched $${meta.symbol} on ${sp}${cur ? `, taking the space from $${cur.symbol}` : ""}.`);
        }
        await c.query(`UPDATE coin_launches SET status = $2, updated_at = now(), processed_at = now() WHERE intent_id = $1`, [it.id, ok ? "placed" : "not_placed"]);
        return ok;
      });
      if (placed === null) return { ...base, ok: true, already: true, message: "Already confirmed and recorded." };
      out.placed = placed;
      out.message = placed ? `$${meta.symbol} is live on Pump.fun and now owns this space.` : `$${meta.symbol} launched on Pump.fun, but someone changed this space first, so it wasn't placed on the board.`;
    } else if (it.kind === "grow") {
      if (!(fx.tokensGained > 0)) { await markFailed(it, sig, "failed", "no tokens received"); fail(409, "tx_mismatch", "That transaction didn't buy the expected coin."); }
      if (fx.spentLamports > Number(it.lamports) + L.buyReserveLamports + 30_000_000) { await markFailed(it, sig, "failed", "spent more than expected"); fail(409, "tx_mismatch", "That transaction spent more than expected."); }
      const done = await db.tx(async (c) => {
        const claim = (await c.query(`UPDATE chain_tx_processing SET status = 'settled', updated_at = now(), processed_at = now() WHERE signature = $1 AND status IN ('submitted','timeout','confirmed') RETURNING 1`, [sig])).rows[0];
        if (!claim) return false;
        const p = (await c.query(`INSERT INTO purchases (signature, user_id, wallet, mint, stop_id, symbol, lamports, spent_lamports, tokens) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (signature) DO NOTHING RETURNING id`,
          [sig, uid, it.wallet, it.mint, it.stop_id, meta.symbol, it.lamports, fx.spentLamports, fx.tokensGained])).rows[0];
        if (!p) return false;
        await c.query(`INSERT INTO coin_txs (signature, kind, user_id, wallet, stop_id, mint, lamports, round_id) VALUES ($1,'grow',$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`, [sig, uid, it.wallet, it.stop_id, it.mint, it.lamports, round && round.id]);
        await c.query(`UPDATE space_coins SET grown_lamports = grown_lamports + $2, grow_count = grow_count + 1, top_buy_lamports = GREATEST(top_buy_lamports, $2) WHERE stop_id = $1 AND mint = $3`, [it.stop_id, it.lamports, it.mint]);
        await addXp(c, it.stop_id, it.lamports);
        await activity(c, "grow", `${user.display_name} bought $${meta.symbol} with ${sol9(it.lamports)} SOL on ${sp}.`);
        return true;
      });
      if (!done) return { ...base, ok: true, already: true, message: "Already confirmed and recorded." };
      out.message = `Bought $${meta.symbol} with ${sol9(it.lamports)} SOL. Confirmed on Solana.`;
    } else {
      return { ...base, ok: false, status: "failed", message: "This request type is retired." };
    }
    await audit(null, { actorUserId: uid, actorWallet: it.wallet, action: `launchpad.${it.kind}`, target: it.mint, details: { stop: it.stop_id, lamports: Number(it.lamports), tx: sig }, ipHash: ipHash(req) });
    spins.bust(it.wallet);
    notify();
    return out;
  }

  // Background: settle transactions that timed out while the player was waiting.
  if (!noScheduler && L.enabled) {
    const t = setInterval(async () => {
      try {
        const rows = (await db.query(`SELECT * FROM chain_tx_processing WHERE status IN ('submitted','timeout') AND created_at < now() - interval '90 seconds' AND created_at > now() - interval '1 day' ORDER BY created_at LIMIT 10`)).rows;
        for (const row of rows) {
          const it = (await db.query(`SELECT * FROM coin_intents WHERE id = $1`, [row.intent_id])).rows[0];
          if (it) await settle({ headers: {}, ip: "0.0.0.0", socket: {} }, it, row.signature).catch(() => {});
        }
      } catch { /* retry next tick */ }
    }, 60e3);
    if (t.unref) t.unref();
  }

  async function addXp(c, stopId, lamports) {
    if (STOPS[stopId].type !== "district") return;
    const xp = Math.max(1, Math.round((Number(lamports) / 1e9) * L.xpPerSol));
    await c.query(`UPDATE districts SET xp = xp + $2, xp_total = xp_total + $2, updated_at = now() WHERE id = $1 AND level < $3`, [stopId, xp, RULES.maxLevel]);
  }

  return r;
}

module.exports = { build };
