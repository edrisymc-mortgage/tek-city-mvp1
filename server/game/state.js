"use strict";
// Read models for the client. Public city state is cached briefly; per-player state is computed per request,
// including server-side "why is this disabled" reasons so the UI never has to guess eligibility.
const db = require("../db/pool");
const { STOPS, RULES, NEIGHBORHOODS, hoodLevels } = require("./board");
const { MOODS, severityFor } = require("./events");
const { shortAddress } = require("../auth/address");
const spins = require("./spins");

let CFG = null;
let cache = { at: 0, version: -1, data: null };
function configure(config) { CFG = config; }

async function cityState() {
  const cs = (await db.query(`SELECT * FROM city_state WHERE id = 1`)).rows[0];
  if (cache.data && cache.version === Number(cs.version) && Date.now() - cache.at < 3000) return cache.data;
  const [roundR, dsR, vaultR, actR, lbR, allR, playersR, upR, coinR] = await Promise.all([
    db.query(`SELECT * FROM game_rounds WHERE status = 'open' ORDER BY id DESC LIMIT 1`),
    db.query(`SELECT id, slug, name, neighborhood, level, xp FROM districts ORDER BY id`),
    db.query(`SELECT progress, milestone, lifetime FROM community_vault WHERE id = 1`),
    db.query(CFG.launchpad.enabled ? `SELECT at, kind, text FROM city_activity WHERE kind IN ('join','move','grow','launch','takeover','jackpot','reward','milestone') ORDER BY id DESC LIMIT 30` : `SELECT at, kind, text FROM city_activity ORDER BY id DESC LIMIT 30`),
    db.query(`SELECT u.display_name AS name, u.kind, pr.influence_today AS influence FROM player_resources pr JOIN users u ON u.id = pr.user_id
               WHERE pr.influence_day = $1 AND pr.influence_today > 0 AND NOT u.is_banned ORDER BY pr.influence_today DESC, u.created_at LIMIT 10`, [isoDay(cs.day)]),
    db.query(`SELECT u.display_name AS name, u.kind, pr.influence FROM player_resources pr JOIN users u ON u.id = pr.user_id
               WHERE pr.influence > 0 AND NOT u.is_banned ORDER BY pr.influence DESC LIMIT 10`),
    db.query(`SELECT u.display_name AS name, u.avatar_seed AS seed, u.kind, pr.position FROM player_resources pr JOIN users u ON u.id = pr.user_id
               WHERE u.last_seen_at > now() - interval '2 hours' AND NOT u.is_banned ORDER BY u.last_seen_at DESC LIMIT 60`),
    db.query(`SELECT d.name, du.to_level, du.created_at FROM district_upgrades du JOIN districts d ON d.id = du.district_id ORDER BY du.id DESC LIMIT 5`),
    db.query(`SELECT sc.stop_id, sc.mint, sc.name, sc.symbol, sc.image_bytes IS NOT NULL AS has_image, sc.launcher_wallet, u.display_name AS launcher, sc.split_done,
                     sc.grown_lamports, sc.grow_count, sc.top_buy_lamports, sc.launch_lamports, sc.created_at,
                     (SELECT u2.display_name FROM coin_txs t JOIN users u2 ON u2.id = t.user_id WHERE t.stop_id = sc.stop_id AND t.mint = sc.mint
                        AND t.created_at > now() - interval '15 minutes' GROUP BY u2.display_name ORDER BY sum(t.lamports) DESC LIMIT 1) AS holder
              FROM space_coins sc LEFT JOIN users u ON u.id = sc.launcher_user_id ORDER BY sc.stop_id`),
  ]);
  const round = roundR.rows[0] || null;
  let event = null;
  if (round) {
    const ev = (await db.query(`SELECT * FROM city_events WHERE round_id = $1 AND kind IN ('brief','crisis') ORDER BY id LIMIT 1`, [round.id])).rows[0];
    if (ev) {
      event = { id: Number(ev.id), kind: ev.kind, title: ev.title, body: ev.body, options: ev.options.map((o) => ({ label: o.label, hint: describeEffects(o.effects) })) };
      if (ev.kind === "brief") {
        const v = (await db.query(`SELECT option_idx, count(*)::int AS n FROM event_votes WHERE event_id = $1 GROUP BY option_idx`, [ev.id])).rows;
        event.tally = ev.options.map((_, i) => (v.find((x) => x.option_idx === i) || { n: 0 }).n);
      } else {
        const got = (await db.query(`SELECT COALESCE(sum(xp),0)::int AS xp FROM district_contributions WHERE round_id = $1 AND district_id = $2`, [round.id, ev.target])).rows[0].xp;
        event.target = ev.target; event.requirement = ev.requirement; event.progress = got; event.severity = severityFor(round.round_number);
      }
    }
  }
  const ds = dsR.rows;
  const hoods = hoodLevels(ds);
  const totalLevels = ds.reduce((a, d) => a + d.level, 0);
  const vault = vaultR.rows[0];
  const data = {
    serverTime: new Date().toISOString(),
    version: Number(cs.version),
    paused: cs.paused, pausedReason: cs.paused ? (cs.paused_reason || "Maintenance") : null,
    day: isoDay(cs.day), dayStatus: cs.day_status,
    recovery: cs.recovery_until ? Number(cs.recovery_until) : null,
    round: round ? { key: round.round_key, number: round.round_number, of: 96, startsAt: round.starts_at, endsAt: round.ends_at } : null,
    stability: cs.stability,
    moods: Object.fromEntries(Object.entries(MOODS).map(([k, m]) => [k, { ...m, value: (cs.moods || {})[k] ?? 50 }])),
    boosts: Object.values(cs.boosts || {}).map((b) => b.label).filter(Boolean),
    event,
    stops: STOPS.map((s) => ({ id: s.id, type: s.type, name: s.name, hood: s.hood || null, text: s.text || null })),
    neighborhoods: Object.fromEntries(Object.entries(NEIGHBORHOODS).map(([k, n]) => [k, { ...n, levels: hoods[k] }])),
    districts: ds.map((d) => ({ id: d.id, name: d.name, hood: d.neighborhood, level: d.level, xp: d.xp, next: d.level >= RULES.maxLevel ? null : RULES.xpForNext(d.level) })),
    vault: { progress: vault.progress, milestone: vault.milestone, milestoneSize: RULES.vaultMilestoneSize, lifetime: Number(vault.lifetime) },
    goal: { levels: totalLevels, levelsNeeded: CFG.game.dayGoalLevels, milestones: vault.milestone, milestonesNeeded: CFG.game.dayGoalVaultMilestones },
    leaderboard: { today: lbR.rows, allTime: allR.rows },
    players: playersR.rows,
    coins: coinR.rows.map((c) => ({
      stop: c.stop_id, mint: c.mint, name: c.name, symbol: c.symbol, image: c.has_image ? `/api/coin-img/${c.stop_id}?m=${c.mint.slice(0, 8)}` : null,
      launcher: c.launcher, launcherWallet: shortAddress(c.launcher_wallet), ready: c.split_done || !(CFG.launchpad.communityWallet || CFG.rewards.walletSecret),
      grownLamports: Number(c.grown_lamports), grows: c.grow_count, takeoverLamports: Math.max(Number(c.top_buy_lamports), Number(c.launch_lamports)), holder: c.holder || null,
      pumpUrl: `https://pump.fun/coin/${c.mint}`,
    })),
    launchpad: { enabled: !!CFG.launchpad.enabled, spins: !!CFG.spins.mint, minBuyLamports: CFG.launchpad.minBuyLamports, maxBuyLamports: CFG.launchpad.maxBuyLamports, tokensPerSpin: CFG.spins.tokensPerSpin },
    activity: actR.rows,
    upgrades: upR.rows,
    rules: { moveCost: RULES.moveCost, contributeCost: RULES.contributeCost, minContribution: RULES.minContribution, maxContribution: RULES.maxContribution, contributionsPerRound: RULES.contributionsPerRound, maxEnergy: RULES.maxEnergy },
  };
  cache = { at: Date.now(), version: Number(cs.version), data };
  return data;
}

function isoDay(d) { return d instanceof Date ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : String(d).slice(0, 10); }

function describeEffects(fx = {}) {
  const parts = [];
  if (fx.stability) parts.push(`Stability ${fx.stability > 0 ? "+" : ""}${fx.stability}`);
  for (const [m, v] of Object.entries(fx.moods || {})) parts.push(`${MOODS[m].name} ${v > 0 ? "+" : ""}${v}`);
  if (fx.vault) parts.push(`Vault +${fx.vault}`);
  if (fx.boost) parts.push(`${NEIGHBORHOODS[fx.boost.hood].name} XP x${fx.boost.mult} next round`);
  if (fx.xpHood) parts.push(`${NEIGHBORHOODS[fx.xpHood.hood].name} districts +${fx.xpHood.amount} XP`);
  if (fx.energy) parts.push(`Everyone +${fx.energy} Energy`);
  if (fx.checkinBonus) parts.push(`Check-ins +${fx.checkinBonus} next round`);
  return parts.join(" · ");
}

async function me(session) {
  if (!session || !session.user_id) return { signedIn: false };
  // Launchpad mode: playing needs a connected wallet. Anyone else (including old guest sessions) watches.
  if (CFG.launchpad.enabled && session.auth_method !== "wallet") return { signedIn: false, watching: true };
  const uid = session.user_id;
  await db.query(`INSERT INTO player_resources (user_id, energy, build_credits) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [uid, RULES.startEnergy, RULES.startCredits]);
  await db.query(`UPDATE users SET last_seen_at = now() WHERE id = $1 AND last_seen_at < now() - interval '1 minute'`, [uid]);
  const [pR, bR, wR, rR, cs] = await Promise.all([
    db.query(`SELECT * FROM player_resources WHERE user_id = $1`, [uid]),
    db.query(`SELECT c.id, c.name, c.description, ub.earned_at FROM user_badges ub JOIN cosmetics c ON c.id = ub.cosmetic_id WHERE ub.user_id = $1 ORDER BY ub.earned_at`, [uid]),
    db.query(`SELECT address FROM wallet_accounts WHERE user_id = $1 AND unlinked_at IS NULL`, [uid]),
    db.query(`SELECT * FROM game_rounds WHERE status = 'open' ORDER BY id DESC LIMIT 1`),
    db.query(`SELECT paused, day FROM city_state WHERE id = 1`),
  ]);
  const p = pR.rows[0];
  const round = rR.rows[0];
  const paused = cs.rows[0].paused;
  const rid = round ? String(round.id) : null;
  let ev = null;
  if (round) ev = (await db.query(`SELECT kind FROM city_events WHERE round_id = $1 AND kind IN ('brief','crisis') LIMIT 1`, [round.id])).rows[0];
  const contribCount = String(p.contrib_round) === rid ? p.contrib_count : 0;
  const closed = !round || new Date(round.ends_at) <= new Date();
  const why = (cond, reason) => (cond ? null : reason);
  const sp = await spins.status(uid).catch(() => ({ enabled: false }));
  const general = paused ? "The city is paused for maintenance." : closed ? "This round is closing. The next one opens in a moment." : null;
  const can = {
    checkin: general || why(String(p.last_checkin_round) !== rid, "Already checked in this round."),
    move: sp.enabled
      ? general || why(!!sp.wallet, "Link your wallet to spin.") || why(sp.left > 0, `No spins left. Buy ${sp.tokensPerSpin.toLocaleString()} TEK CITY or pass START for another.`)
      : CFG.launchpad.enabled ? general || why(String(p.last_move_round) !== rid || (p.bonus_left || 0) > 0, "Free spin used. Next one at the tick.")
      : general || why(String(p.last_move_round) !== rid, "Already moved this round.") || why(p.energy >= RULES.moveCost, `Needs ${RULES.moveCost} Energy.`),
    contribute: general || why(contribCount < RULES.contributionsPerRound, `All ${RULES.contributionsPerRound} contributions used this round.`) || why(p.energy >= RULES.contributeCost, "Needs 1 Energy.") || why(p.build_credits >= RULES.minContribution, `Needs at least ${RULES.minContribution} Build Credits.`),
    vote: general || why(ev && ev.kind === "brief", "No City Brief this round (crisis in progress).") || why(String(p.last_vote_round) !== rid, "Already voted this round."),
  };
  const influenceToday = p.influence_day && isoDay(p.influence_day) === isoDay(cs.rows[0].day) ? p.influence_today : 0;
  return {
    signedIn: true,
    user: {
      name: session.display_name, kind: session.user_kind, seed: session.avatar_seed, authMethod: session.auth_method,
      wallet: wR.rows[0] ? { address: wR.rows[0].address, short: shortAddress(wR.rows[0].address) } : null,
    },
    resources: { energy: p.energy, maxEnergy: RULES.maxEnergy, build_credits: p.build_credits, influence: p.influence, influence_today: influenceToday },
    position: p.position,
    onSite: String(p.visited_round) === rid ? p.position : null,
    contributionsLeft: RULES.contributionsPerRound - contribCount,
    tutorialDone: p.tutorial_done,
    spins: sp.enabled ? sp : { ...sp, perRound: true, left: (String(p.last_move_round) !== rid ? 1 : 0) + (p.bonus_left || 0), bonus: p.bonus_total || 0 },
    badges: bR.rows,
    can,
    csrf: session.csrf_token,
  };
}

function bust() { cache = { at: 0, version: -1, data: null }; }

module.exports = { configure, cityState, me, bust, describeEffects };
