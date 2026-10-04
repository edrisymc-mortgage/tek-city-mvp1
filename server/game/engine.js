"use strict";
// Server-authoritative game engine. Every random outcome, balance change, cooldown and round
// transition happens here, inside database transactions. The browser only sends intents.
const crypto = require("crypto");
const db = require("../db/pool");
const { STOPS, RULES, NEIGHBORHOODS, hoodLevels } = require("./board");
const { BRIEFS, CRISES, MOODS, severityFor, isCrisisRound } = require("./events");
const { audit, activity } = require("../audit");
const { fail } = require("../security/util");

let CFG = null;
function configure(config) { CFG = config; }
const roundMs = () => CFG.game.roundMinutes * 60e3;

// ---------------------------------------------------------------- time slots (UTC wall clock)
function slotFor(now = new Date()) {
  const t = now.getTime();
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const idx = Math.min(95, Math.floor((t - dayStart) / roundMs()));
  const startsAt = new Date(dayStart + idx * roundMs());
  const endsAt = new Date(Math.min(dayStart + 86400e3, startsAt.getTime() + roundMs()));
  return { day: new Date(dayStart).toISOString().slice(0, 10), roundNumber: idx + 1, startsAt, endsAt };
}
const dayOf = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));
const rnd = (n) => crypto.randomInt(n);

// ---------------------------------------------------------------- rounds
async function createRound(client, now, cityDay) {
  const s = slotFor(now);
  let key = `${s.day}#${String(s.roundNumber).padStart(2, "0")}`;
  const exists = await client.query(`SELECT count(*)::int AS n FROM game_rounds WHERE round_key LIKE $1`, [key + "%"]);
  if (exists.rows[0].n) key += `.${exists.rows[0].n}`;
  const r = await client.query(
    `INSERT INTO game_rounds (round_key, day, round_number, starts_at, ends_at, status)
     VALUES ($1,$2,$3,$4,$5,'open') RETURNING *`,
    [key, s.day, s.roundNumber, now < s.startsAt ? s.startsAt : now, s.endsAt]
  );
  const round = r.rows[0];
  await createRoundEvent(client, round);
  return round;
}

async function createRoundEvent(client, round) {
  if (isCrisisRound(round.round_number)) {
    const sev = severityFor(round.round_number);
    const ds = await client.query(`SELECT id, name FROM districts WHERE level < $1 ORDER BY id`, [RULES.maxLevel]);
    if (ds.rowCount) {
      const d = ds.rows[rnd(ds.rowCount)];
      const c = CRISES[rnd(CRISES.length)];
      const requirement = 60 * sev;
      await client.query(
        `INSERT INTO city_events (round_id, kind, code, title, body, target, requirement, options)
         VALUES ($1,'crisis',$2,$3,$4,$5,$6,'[]')`,
        [round.id, c.code, `${c.title} · Severity ${sev}`, c.body.replace("{d}", d.name) + ` Contribute ${requirement} District XP to ${d.name} before the tick to contain it.`, d.id, requirement]
      );
      await activity(client, "crisis", `Crisis: ${c.title} at ${d.name} (severity ${sev}). The city needs ${requirement} District XP there this round.`);
      return;
    }
  }
  const b = BRIEFS[rnd(BRIEFS.length)];
  await client.query(
    `INSERT INTO city_events (round_id, kind, code, title, body, options) VALUES ($1,'brief',$2,$3,$4,$5)`,
    [round.id, b.code, b.title, b.body, JSON.stringify(b.options.map((o) => ({ label: o.label, effects: o.effects })))]
  );
}

async function getOpenRound(client, lock = "") {
  const r = await client.query(`SELECT * FROM game_rounds WHERE status = 'open' ORDER BY id DESC LIMIT 1 ${lock}`);
  return r.rows[0] || null;
}

async function ensureOpenRound(now = new Date()) {
  return db.tx(async (c) => {
    await c.query(`SELECT 1 FROM city_state WHERE id = 1 FOR UPDATE`);
    const open = await getOpenRound(c);
    if (open) return open;
    const cs = (await c.query(`SELECT * FROM city_state WHERE id = 1`)).rows[0];
    return createRound(c, now, cs.day);
  });
}

// ---------------------------------------------------------------- resources (always transactional + ledgered)
async function ensurePlayer(client, userId) {
  await client.query(
    `INSERT INTO player_resources (user_id, energy, build_credits) VALUES ($1,$2,$3) ON CONFLICT (user_id) DO NOTHING`,
    [userId, RULES.startEnergy, RULES.startCredits]
  );
}

async function lockPlayer(client, userId) {
  await ensurePlayer(client, userId);
  return (await client.query(`SELECT * FROM player_resources WHERE user_id = $1 FOR UPDATE`, [userId])).rows[0];
}

async function changeResources(client, userId, roundId, deltas, reason, actionId, today) {
  const e = deltas.energy || 0, b = deltas.build_credits || 0, inf = deltas.influence || 0;
  if (!e && !b && !inf) return null;
  const r = await client.query(
    `UPDATE player_resources SET
       energy = LEAST($2, energy + $3),
       build_credits = build_credits + $4,
       influence = influence + $5,
       influence_today = CASE WHEN influence_day = $6::date THEN influence_today + $5 ELSE GREATEST($5, 0) END,
       influence_day = $6::date,
       updated_at = now()
     WHERE user_id = $1 RETURNING energy, build_credits, influence`,
    [userId, RULES.maxEnergy, e, b, inf, today]
  );
  const row = r.rows[0];
  for (const [res, d] of [["energy", e], ["build_credits", b], ["influence", inf]]) {
    if (d) await client.query(
      `INSERT INTO resource_ledger (user_id, round_id, resource, delta, balance_after, reason, action_id) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [userId, roundId, res, d, row[res], reason, actionId]
    );
  }
  return row;
}

async function grantBadge(client, userId, cosmeticId) {
  const r = await client.query(`INSERT INTO user_badges (user_id, cosmetic_id) VALUES ($1,$2) ON CONFLICT DO NOTHING RETURNING 1`, [userId, cosmeticId]);
  return r.rowCount > 0;
}

// ---------------------------------------------------------------- actions
const ACTIONS = ["checkin", "move", "contribute", "vote"];

async function performAction(userId, type, payload, idemKey, ctx = {}) {
  if (!ACTIONS.includes(type)) fail(400, "bad_action", "Unknown action.");
  const now = ctx.now || new Date();
  return db.tx(async (c) => {
    const cs = (await c.query(`SELECT * FROM city_state WHERE id = 1`)).rows[0];
    if (cs.paused) fail(423, "paused", "The city is paused for maintenance. Your progress is safe.");
    const round = await getOpenRound(c, "FOR SHARE");
    if (!round || new Date(round.ends_at) <= now) fail(409, "round_closed", "This round is closing. The next round opens in a moment.");

    // Idempotency: one row per (user, key). A retry with the same key returns the original result.
    const ins = await c.query(
      `INSERT INTO player_actions (user_id, round_id, action_type, idempotency_key, payload)
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT (user_id, idempotency_key) DO NOTHING RETURNING id`,
      [userId, round.id, type, idemKey, JSON.stringify(payload || {})]
    );
    if (!ins.rowCount) {
      const prev = (await c.query(`SELECT action_type, result FROM player_actions WHERE user_id = $1 AND idempotency_key = $2`, [userId, idemKey])).rows[0];
      if (!prev || prev.action_type !== type) fail(409, "idempotency_conflict", "This request key was already used for a different action.");
      return { ...prev.result, replayed: true };
    }
    const actionId = ins.rows[0].id;
    const p = await lockPlayer(c, userId);
    const today = dayOf(round.day);
    const user = (await c.query(`SELECT display_name FROM users WHERE id = $1`, [userId])).rows[0];
    const ds = (await c.query(`SELECT * FROM districts ORDER BY id`)).rows;
    const hoods = hoodLevels(ds);
    const env = { c, round, p, userId, actionId, today, cs, hoods, ds, name: user.display_name, now };

    let result;
    if (type === "checkin") result = await doCheckin(env);
    else if (type === "move") result = await doMove(env);
    else if (type === "contribute") result = await doContribute(env, payload);
    else result = await doVote(env, payload);

    const after = (await c.query(`SELECT energy, build_credits, influence FROM player_resources WHERE user_id = $1`, [userId])).rows[0];
    result = { ok: true, action: type, round: round.round_number, resources: after, ...result };
    await c.query(`UPDATE player_actions SET result = $2 WHERE id = $1`, [actionId, JSON.stringify(result)]);
    await c.query(`UPDATE city_state SET version = version + 1 WHERE id = 1`);
    await audit(c, { actorUserId: userId, action: `game.${type}`, target: round.round_key, details: { ...summarize(result), actionId }, ipHash: ctx.ipHash });
    return result;
  });
}

function summarize(r) {
  const out = { resources: r.resources };
  for (const k of ["roll", "to", "districtId", "amount", "xp", "option", "gained"]) if (r[k] !== undefined) out[k] = r[k];
  return out;
}

async function doCheckin({ c, round, p, userId, actionId, today, cs, hoods, name }) {
  if (String(p.last_checkin_round) === String(round.id)) fail(409, "already_checked_in", "You already checked in this round. Come back after the next tick.");
  const moods = cs.moods || {};
  let credits = RULES.checkinCredits + Math.min(15, hoods.brick) + ((cs.boosts && cs.boosts.checkinBonus && cs.boosts.checkinBonus.amount) || 0);
  if (moods.merchants >= 70) credits += 5;
  if (moods.merchants <= 30) credits = Math.max(5, credits - 5);
  await c.query(`UPDATE player_resources SET last_checkin_round = $2 WHERE user_id = $1`, [userId, round.id]);
  await changeResources(c, userId, round.id, { build_credits: credits, energy: 1, influence: 1 }, "checkin", actionId, today);
  await activity(c, "checkin", `${name} checked in.`);
  return { gained: { build_credits: credits, energy: 1, influence: 1 }, message: `Checked in: +${credits} Build Credits, +1 Energy, +1 Influence.` };
}

const DISPATCHES = [
  { text: "Found a stack of spare materials.", gain: { build_credits: 25 } },
  { text: "A neighbor vouched for your work.", gain: { influence: 4 } },
  { text: "Free coffee at the depot.", gain: { energy: 1 } },
  { text: "Dropped off blueprints at a random district.", gain: {}, randomXp: 20 },
  { text: "Picked up a small grant.", gain: { build_credits: 15, influence: 1 } },
];

async function doMove({ c, round, p, userId, actionId, today, hoods, ds, name }) {
  if (String(p.last_move_round) === String(round.id)) fail(409, "already_moved", "You already moved this round. Your next move unlocks at the tick.");
  if (p.energy < RULES.moveCost) fail(409, "no_energy", `Moving needs ${RULES.moveCost} Energy. Energy refills by ${RULES.energyRegenPerRound} every round, or check in for +1.`);
  const roll = rnd(6) + 1;
  const from = p.position;
  const path = [];
  let pos = from;
  let passed = false;
  for (let i = 0; i < roll; i++) { pos = (pos + 1) % STOPS.length; path.push(pos); if (pos === 0) passed = true; }
  const gained = { energy: -RULES.moveCost, build_credits: 0, influence: 0 };
  const notes = [];
  if (passed) { const g = RULES.stationPass + 5 * hoods.gilded; gained.build_credits += g; notes.push(`Passed Central Station: +${g} Build Credits`); }
  const stop = STOPS[pos];
  let visit = null;
  let dispatch = null;
  if (stop.type === "district") {
    gained.build_credits += RULES.siteStipend;
    visit = pos;
    notes.push(`On site at ${stop.name}: +${RULES.siteStipend} Build Credits. Contributions here earn 1.5x District XP this round.`);
  } else if (stop.type === "workshop") {
    gained.build_credits += RULES.workshopCredits; gained.energy += 1;
    notes.push(`Maker Workshop: +${RULES.workshopCredits} Build Credits, +1 Energy`);
  } else if (stop.type === "vault") {
    await addVault(c, 10);
    gained.influence += 3;
    notes.push("Community Vault: +10 Vault progress, +3 Influence");
  } else if (stop.type === "plaza") {
    gained.influence += 5; notes.push("Founders Plaza: +5 Influence");
  } else if (stop.type === "desk") {
    dispatch = DISPATCHES[rnd(DISPATCHES.length)];
    for (const [k, v] of Object.entries(dispatch.gain)) gained[k] += v;
    if (dispatch.randomXp) {
      const open = ds.filter((d) => d.level < RULES.maxLevel);
      if (open.length) {
        const d = open[rnd(open.length)];
        await c.query(`UPDATE districts SET xp = xp + $2, xp_total = xp_total + $2, updated_at = now() WHERE id = $1`, [d.id, dispatch.randomXp]);
        notes.push(`City Desk: blueprints delivered to ${d.name} (+${dispatch.randomXp} District XP)`);
      }
    } else notes.push(`City Desk: ${dispatch.text}`);
  }
  await c.query(`UPDATE player_resources SET position = $2, last_move_round = $3, visited_round = $4 WHERE user_id = $1`,
    [userId, pos, round.id, visit === null ? p.visited_round : round.id]);
  await changeResources(c, userId, round.id, gained, "move", actionId, today);
  await activity(c, "move", `${name} rolled a ${roll} and rode to ${stop.name}.`);
  return { roll, from, to: pos, path, stop: { id: pos, name: stop.name, type: stop.type }, gained, notes, message: notes.join(". ") || `Rode to ${stop.name}.` };
}

async function addVault(c, n) {
  if (n > 0) await c.query(`UPDATE community_vault SET progress = progress + $1, lifetime = lifetime + $1, updated_at = now() WHERE id = 1`, [n]);
}

async function doContribute({ c, round, p, userId, actionId, today, cs, ds, name }, payload) {
  const { districtId, amount } = payload;
  const d = ds.find((x) => x.id === districtId);
  if (!d) fail(400, "bad_district", "That is not a district.");
  if (amount % 5 !== 0 || amount < RULES.minContribution || amount > RULES.maxContribution) fail(400, "bad_amount", `Contribute between ${RULES.minContribution} and ${RULES.maxContribution} Build Credits in steps of 5.`);
  const count = String(p.contrib_round) === String(round.id) ? p.contrib_count : 0;
  if (count >= RULES.contributionsPerRound) fail(409, "contrib_limit", `You've made ${RULES.contributionsPerRound} contributions this round. More unlock at the tick.`);
  if (p.energy < RULES.contributeCost) fail(409, "no_energy", "Contributing needs 1 Energy. Energy refills every round.");
  if (p.build_credits < amount) fail(409, "no_credits", `You have ${p.build_credits} Build Credits. Check in or ride the line to earn more.`);
  const locked = (await c.query(`SELECT * FROM districts WHERE id = $1 FOR UPDATE`, [districtId])).rows[0];
  if (locked.level >= RULES.maxLevel) fail(409, "district_complete", `${locked.name} is fully built for today. Help another district.`);

  const onSite = p.position === districtId && String(p.visited_round) === String(round.id);
  let mult = onSite ? RULES.visitMultiplier : 1;
  const moods = cs.moods || {};
  if (moods.makers >= 70) mult *= 1.1;
  if (moods.makers <= 30) mult *= 0.9;
  const boost = cs.boosts && cs.boosts.hood_xp;
  if (boost && boost.hood === d.neighborhood) mult *= boost.mult;
  if (cs.recovery_until && Number(cs.recovery_until) >= round.round_number) mult *= 0.5;
  const xp = Math.max(1, Math.round(amount * mult));
  const influence = Math.floor(amount / 10);
  const vault = Math.floor(amount * RULES.vaultShare);

  await c.query(`UPDATE districts SET xp = xp + $2, xp_total = xp_total + $2, updated_at = now() WHERE id = $1`, [districtId, xp]);
  await c.query(
    `INSERT INTO district_contributions (district_id, user_id, round_id, action_id, amount, xp, level_at, day) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [districtId, userId, round.id, actionId, amount, xp, locked.level, today]
  );
  await c.query(`UPDATE player_resources SET contrib_round = $2, contrib_count = $3 WHERE user_id = $1`, [userId, round.id, count + 1]);
  await changeResources(c, userId, round.id, { build_credits: -amount, energy: -RULES.contributeCost, influence }, "contribute", actionId, today);
  await addVault(c, vault);
  const firstBadge = await grantBadge(c, userId, "first-brick");
  await activity(c, "build", `${name} put ${amount} Build Credits into ${locked.name} (+${xp} District XP).`);
  return {
    districtId, amount, xp, onSite, vault, firstBadge,
    gained: { build_credits: -amount, energy: -RULES.contributeCost, influence },
    message: `+${xp} District XP to ${locked.name}${onSite ? " (on-site 1.5x)" : ""}. +${influence} Influence, +${vault} Vault progress.`,
  };
}

async function doVote({ c, round, p, userId, actionId, today, hoods, name }, payload) {
  const ev = (await c.query(`SELECT * FROM city_events WHERE round_id = $1 AND kind = 'brief' AND status = 'active' LIMIT 1`, [round.id])).rows[0];
  if (!ev) fail(409, "no_vote", "There's no City Brief to vote on this round. Help contain the crisis instead.");
  if (String(p.last_vote_round) === String(round.id)) fail(409, "already_voted", "You already voted on this round's City Brief.");
  if (payload.option >= ev.options.length) fail(400, "bad_option", "That option doesn't exist.");
  await c.query(`INSERT INTO event_votes (event_id, user_id, option_idx) VALUES ($1,$2,$3)`, [ev.id, userId, payload.option]);
  await c.query(`UPDATE player_resources SET last_vote_round = $2 WHERE user_id = $1`, [userId, round.id]);
  const inf = 2 + Math.floor(hoods.signal / 2);
  await changeResources(c, userId, round.id, { influence: inf }, "vote", actionId, today);
  await activity(c, "vote", `${name} voted on ${ev.title}.`);
  return { option: payload.option, gained: { influence: inf }, message: `Vote recorded: "${ev.options[payload.option].label}". +${inf} Influence. Results settle at the tick.` };
}

// ---------------------------------------------------------------- settlement (atomic, runs once per round)
async function settleDue(now = new Date(), { force = false, by = "scheduler" } = {}) {
  return db.tx(async (c) => {
    const cs = (await c.query(`SELECT * FROM city_state WHERE id = 1 FOR UPDATE`)).rows[0];
    if (cs.paused && !force) return null;
    const round = await getOpenRound(c, "FOR UPDATE");
    if (!round) { await createRound(c, now, cs.day); return null; }
    if (!force && new Date(round.ends_at) > now) return null;
    await c.query(`UPDATE game_rounds SET status = 'settling' WHERE id = $1`, [round.id]);

    const summary = { round: round.round_key, levelUps: [], event: null, vault: {}, regen: 0 };
    const today = dayOf(round.day);
    let stability = cs.stability;
    const moods = { makers: 50, merchants: 50, residents: 50, ...(cs.moods || {}) };
    let boosts = { ...(cs.boosts || {}) };
    // expire one-round boosts that were active during this round
    for (const k of Object.keys(boosts)) { if (boosts[k].rounds !== undefined) { boosts[k].rounds -= 1; if (boosts[k].rounds <= 0) delete boosts[k]; } }
    let extraEnergyAll = 0;

    // 1) City event
    const ev = (await c.query(`SELECT * FROM city_events WHERE round_id = $1 AND status = 'active' AND kind IN ('brief','crisis') LIMIT 1 FOR UPDATE`, [round.id])).rows[0];
    if (ev && ev.kind === "brief") {
      const votes = (await c.query(`SELECT option_idx, count(*)::int AS n FROM event_votes WHERE event_id = $1 GROUP BY option_idx`, [ev.id])).rows;
      const tally = ev.options.map((_, i) => (votes.find((v) => v.option_idx === i) || { n: 0 }).n);
      const total = tally.reduce((a, b) => a + b, 0);
      const max = Math.max(...tally);
      const winner = total === 0 ? ev.options.length - 1 : tally.indexOf(max); // no votes: council keeps the status quo (last option)
      const fx = ev.options[winner].effects || {};
      if (fx.stability) stability += fx.stability;
      for (const [m, v] of Object.entries(fx.moods || {})) moods[m] = clamp((moods[m] || 50) + v);
      if (fx.vault) await addVault(c, fx.vault);
      if (fx.boost) boosts.hood_xp = { ...fx.boost, rounds: 1, label: `${NEIGHBORHOODS[fx.boost.hood].name} contributions x${fx.boost.mult}` };
      if (fx.checkinBonus) boosts.checkinBonus = { amount: fx.checkinBonus, rounds: 1, label: `Check-ins +${fx.checkinBonus} Build Credits` };
      if (fx.energy) extraEnergyAll += fx.energy;
      if (fx.xpHood) await c.query(`UPDATE districts SET xp = xp + $2, xp_total = xp_total + $2 WHERE neighborhood = $1 AND level < $3`, [fx.xpHood.hood, fx.xpHood.amount, RULES.maxLevel]);
      const outcome = { winner, label: ev.options[winner].label, tally, total };
      await c.query(`UPDATE city_events SET status = 'resolved', outcome = $2 WHERE id = $1`, [ev.id, JSON.stringify(outcome)]);
      await activity(c, "event", `${ev.title}: the city chose "${ev.options[winner].label}"${total ? ` (${max} of ${total} votes)` : " (no votes, status quo)"}.`);
      summary.event = { title: ev.title, ...outcome };
    } else if (ev && ev.kind === "crisis") {
      const got = (await c.query(`SELECT COALESCE(sum(xp),0)::int AS xp FROM district_contributions WHERE round_id = $1 AND district_id = $2`, [round.id, ev.target])).rows[0].xp;
      const d = (await c.query(`SELECT * FROM districts WHERE id = $1`, [ev.target])).rows[0];
      const sev = severityFor(round.round_number);
      const contained = got >= ev.requirement;
      if (contained) {
        stability += 3; moods.residents = clamp(moods.residents + 4);
        const crew = (await c.query(`SELECT DISTINCT user_id FROM district_contributions WHERE round_id = $1 AND district_id = $2`, [round.id, ev.target])).rows;
        for (const u of crew) await grantBadge(c, u.user_id, "crisis-crew");
        await activity(c, "event", `${ev.title.split(" ·")[0]} contained at ${d.name}. Stability +3.`);
      } else {
        const loss = Math.min(d.xp, Math.round(ev.requirement / 2));
        await c.query(`UPDATE districts SET xp = xp - $2 WHERE id = $1`, [d.id, loss]);
        stability -= 4 * sev; moods.residents = clamp(moods.residents - 6);
        await activity(c, "crisis", `${ev.title.split(" ·")[0]} hit ${d.name}: -${loss} District XP, Stability -${4 * sev}.`);
      }
      const outcome = { contained, xp: got, requirement: ev.requirement };
      await c.query(`UPDATE city_events SET status = 'resolved', outcome = $2 WHERE id = $1`, [ev.id, JSON.stringify(outcome)]);
      summary.event = { title: ev.title, ...outcome };
    }

    // 2) District level-ups (credited to that level's contributors)
    const ds = (await c.query(`SELECT * FROM districts ORDER BY id FOR UPDATE`)).rows;
    for (const d of ds) {
      while (d.level < RULES.maxLevel && d.xp >= RULES.xpForNext(d.level)) {
        const from = d.level;
        d.xp -= RULES.xpForNext(from);
        d.level += 1;
        await c.query(`UPDATE districts SET level = $2, xp = $3, updated_at = now() WHERE id = $1`, [d.id, d.level, d.xp]);
        await c.query(`INSERT INTO district_upgrades (district_id, from_level, to_level, round_id) VALUES ($1,$2,$3,$4)`, [d.id, from, d.level, round.id]);
        const crew = (await c.query(
          `SELECT user_id, sum(xp)::int AS xp FROM district_contributions WHERE district_id = $1 AND day = $2 AND level_at = $3 GROUP BY user_id`,
          [d.id, today, from]
        )).rows;
        const totalXp = crew.reduce((a, r) => a + r.xp, 0) || 1;
        for (const r of crew) {
          await changeResources(c, r.user_id, round.id, { influence: 5 + Math.floor((r.xp / totalXp) * 20) }, `level_up:${d.slug}`, null, today);
          await grantBadge(c, r.user_id, "crew-chief");
        }
        summary.levelUps.push({ district: d.name, to: d.level, crew: crew.length });
        await activity(c, "upgrade", `${d.name} reached Level ${d.level}. ${crew.length} builder${crew.length === 1 ? "" : "s"} credited.`);
      }
      if (d.level >= RULES.maxLevel && d.xp > 0) await c.query(`UPDATE districts SET xp = 0 WHERE id = $1`, [d.id]);
    }
    const hoods = hoodLevels(ds);

    // 3) Neighborhood production + citizen moods
    await addVault(c, hoods.harbor);
    stability += Math.floor(hoods.greenway / 3);
    if (moods.residents >= 70) stability += 1;
    if (moods.residents <= 30) stability -= 1;
    for (const m of Object.keys(MOODS)) { if (moods[m] > 52) moods[m] -= 1; else if (moods[m] < 48) moods[m] += 1; } // drift to neutral
    if (hoods.heights >= 6) extraEnergyAll += 1;

    // 4) Energy regeneration for every player (covers rounds missed while the server slept)
    const missed = Math.min(95, Math.max(0, Math.floor((now - new Date(round.ends_at)) / roundMs())));
    const regen = RULES.energyRegenPerRound * (1 + missed) + extraEnergyAll;
    const rg = await c.query(
      `WITH o AS (SELECT user_id, energy AS old FROM player_resources WHERE energy < $1 FOR UPDATE),
            u AS (UPDATE player_resources p SET energy = LEAST($1, p.energy + $2) FROM o WHERE p.user_id = o.user_id
                  RETURNING p.user_id, p.energy, p.energy - o.old AS delta)
       INSERT INTO resource_ledger (user_id, round_id, resource, delta, balance_after, reason)
       SELECT user_id, $3, 'energy', delta, energy, 'round_regen' FROM u WHERE delta > 0`,
      [RULES.maxEnergy, regen, round.id]
    );
    summary.regen = { amount: regen, players: rg.rowCount };

    // 5) Community Vault milestones -> city-wide unlocks (non-cash)
    const v = (await c.query(`SELECT * FROM community_vault WHERE id = 1 FOR UPDATE`)).rows[0];
    let milestone = v.milestone;
    while (v.progress >= RULES.vaultMilestoneSize * (milestone + 1)) {
      milestone += 1;
      const hoodKeys = Object.keys(NEIGHBORHOODS);
      const hood = hoodKeys[rnd(hoodKeys.length)];
      boosts.hood_xp = { kind: "hood_xp", hood, mult: 2, rounds: 1, label: `Vault unlock: ${NEIGHBORHOODS[hood].name} contributions x2` };
      const active = (await c.query(`SELECT DISTINCT user_id FROM player_actions WHERE created_at >= $1::date`, [today])).rows;
      for (const a of active) { await grantBadge(c, a.user_id, "vault-keeper"); await changeResources(c, a.user_id, round.id, { influence: 10 }, "vault_milestone", null, today); }
      await c.query(`INSERT INTO city_events (round_id, kind, code, title, body, status) VALUES ($1,'unlock',$2,$3,$4,'resolved')`,
        [round.id, `vault-${milestone}`, `Vault Milestone ${milestone}`, `The Community Vault reached milestone ${milestone}. ${NEIGHBORHOODS[hood].name} contributions earn double District XP next round, and active builders earned the Vault Keeper badge.`]);
      await activity(c, "unlock", `Community Vault milestone ${milestone} unlocked: ${NEIGHBORHOODS[hood].name} build boost next round.`);
    }
    if (milestone !== v.milestone) await c.query(`UPDATE community_vault SET milestone = $1 WHERE id = 1`, [milestone]);
    summary.vault = { progress: v.progress, milestone };

    // 6) Stability, failure (blackout) and victory (city thrives)
    stability = clamp(stability);
    let dayStatus = cs.day_status;
    let recoveryUntil = cs.recovery_until;
    if (stability === 0 && dayStatus === "active") {
      dayStatus = "blackout";
      recoveryUntil = round.round_number + 4;
      stability = 30;
      await activity(c, "crisis", "BLACKOUT: city Stability hit zero. Today's goal is lost and contributions earn half XP for 4 rounds while the city recovers.");
    }
    const totalLevels = ds.reduce((a, d) => a + d.level, 0);
    if (dayStatus === "active" && totalLevels >= CFG.game.dayGoalLevels && milestone >= CFG.game.dayGoalVaultMilestones) {
      dayStatus = "thrived";
      const active = (await c.query(`SELECT DISTINCT user_id FROM player_actions WHERE created_at >= $1::date`, [today])).rows;
      for (const a of active) { await grantBadge(c, a.user_id, "city-thrives"); await changeResources(c, a.user_id, round.id, { influence: 25 }, "day_goal", null, today); }
      await activity(c, "unlock", `TEK CITY THRIVES: the daily goal is complete. ${active.length} builders earned the City Thrives badge.`);
    }

    // 7) Leaderboard snapshot
    const lb = (await c.query(
      `SELECT u.display_name AS name, pr.influence_today AS influence FROM player_resources pr JOIN users u ON u.id = pr.user_id
        WHERE pr.influence_day = $1 AND pr.influence_today > 0 AND NOT u.is_banned ORDER BY pr.influence_today DESC, u.created_at LIMIT 25`, [today])).rows;
    await c.query(`INSERT INTO leaderboard_snapshots (round_id, scope, entries) VALUES ($1,'today',$2)`, [round.id, JSON.stringify(lb)]);

    // 8) Close this round
    summary.stability = stability; summary.moods = moods; summary.dayStatus = dayStatus; summary.totalLevels = totalLevels;
    await c.query(`UPDATE game_rounds SET status = 'settled', settled_at = now(), settlement = $2 WHERE id = $1`, [round.id, JSON.stringify(summary)]);

    // 9) Day rollover: a new city day starts fresh districts, vault, and stability. Player resources and badges carry over.
    const next = slotFor(now);
    let cityDay = dayOf(cs.day);
    if (next.day !== today) {
      const final = dayStatus === "active" ? "unfinished" : dayStatus;
      await c.query(`INSERT INTO city_events (round_id, kind, code, title, body, status, outcome) VALUES ($1,'day',$2,$3,$4,'resolved',$5)`,
        [round.id, `day-${today}`, `Day ${today} closed`, `The city day ended: ${final}.`, JSON.stringify({ final, totalLevels, milestone })]);
      await c.query(`UPDATE districts SET level = 1, xp = 0, updated_at = now()`);
      await c.query(`UPDATE community_vault SET progress = 0, milestone = 0, updated_at = now() WHERE id = 1`);
      stability = 70; dayStatus = "active"; recoveryUntil = null; boosts = {};
      for (const m of Object.keys(moods)) moods[m] = 50;
      cityDay = next.day;
      await activity(c, "day", `Day ${today} ended (${final}). A new city day begins: every district is back to Level 1.`);
    }
    if (recoveryUntil && next.day === today && next.roundNumber > Number(recoveryUntil)) recoveryUntil = null;
    await c.query(
      `UPDATE city_state SET stability = $1, moods = $2, boosts = $3, day_status = $4, recovery_until = $5, day = $6, version = version + 1, updated_at = now() WHERE id = 1`,
      [stability, JSON.stringify(moods), JSON.stringify(boosts), dayStatus, recoveryUntil, cityDay]
    );
    const opened = await createRound(c, now, cityDay);
    summary.next = opened.round_key;
    await audit(c, { action: "round.settled", target: round.round_key, details: { by, levelUps: summary.levelUps.length, event: summary.event && summary.event.title, next: opened.round_key, stability } });
    return summary;
  });
}
const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));

module.exports = { configure, slotFor, ensureOpenRound, settleDue, performAction, ensurePlayer, changeResources, grantBadge, getOpenRound, ACTIONS };
