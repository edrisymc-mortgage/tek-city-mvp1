"use strict";
// What players earn through the game, for Community Fund payouts. Records only; no SOL moves here.
//   leaderboard  daily points (spins, passing START, launches, buy-ins, takeovers). Top 3 each UTC day earn
//                weights 5 / 3 / 2 once the day is over.
//   vault        whoever hits the Vault jackpot (once per 12 hours across the board) earns weight 1.
//   milestone    every player with a wallet who played in the 24 hours before a market-cap milestone earns weight 1.
// Earnings turn into SOL only when an admin prepares a payout batch and the treasury wallet approves it.
const db = require("../db/pool");

const POINTS = { spin: 1, pass_start: 2, launch: 10, grow: 3, takeover: 15 };
const LEADER_WEIGHTS = [5, 3, 2];

async function walletOf(c, userId) {
  const w = (await c.query(`SELECT address FROM wallet_accounts WHERE user_id = $1 AND unlinked_at IS NULL ORDER BY linked_at LIMIT 1`, [userId])).rows[0];
  return w ? w.address : null;
}

async function addPoints(c, userId, kind, times = 1) {
  const n = (POINTS[kind] || 0) * times;
  if (!n || !userId) return;
  await c.query(`INSERT INTO player_points (user_id, day, points) VALUES ($1, (now() AT TIME ZONE 'UTC')::date, $2)
                 ON CONFLICT (user_id, day) DO UPDATE SET points = player_points.points + EXCLUDED.points`, [userId, n]);
}

async function earn(c, userId, category, ref, weight = 1) {
  const wallet = await walletOf(c, userId);
  if (!wallet) return false;
  const r = await c.query(`INSERT INTO player_earnings (user_id, wallet, category, ref, weight) VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`, [userId, wallet, category, ref, weight]);
  return r.rowCount > 0;
}

// Close every finished UTC day that hasn't been ranked yet.
async function finalizeLeaderboards() {
  const days = (await db.query(`SELECT DISTINCT day FROM player_points WHERE day < (now() AT TIME ZONE 'UTC')::date
     AND NOT EXISTS (SELECT 1 FROM player_earnings e WHERE e.category = 'leaderboard' AND e.ref LIKE 'day:' || player_points.day::text || ':%') ORDER BY day LIMIT 60`)).rows;
  let n = 0;
  for (const { day } of days) {
    const d = new Date(day).toISOString().slice(0, 10);
    await db.tx(async (c) => {
      const top = (await c.query(`SELECT pp.user_id FROM player_points pp JOIN users u ON u.id = pp.user_id
          WHERE pp.day = $1 AND pp.points > 0 AND NOT u.is_banned
            AND EXISTS (SELECT 1 FROM wallet_accounts w WHERE w.user_id = pp.user_id AND w.unlinked_at IS NULL)
          ORDER BY pp.points DESC, u.created_at LIMIT 3`, [d])).rows;
      for (let i = 0; i < top.length; i++) if (await earn(c, top[i].user_id, "leaderboard", `day:${d}:${i + 1}`, LEADER_WEIGHTS[i])) n++;
    });
  }
  return n;
}

async function milestoneReached(milestoneId) {
  const users = (await db.query(`SELECT DISTINCT u.id FROM users u JOIN wallet_accounts w ON w.user_id = u.id AND w.unlinked_at IS NULL
      WHERE NOT u.is_banned AND u.last_seen_at > now() - interval '24 hours'`)).rows;
  let n = 0;
  await db.tx(async (c) => { for (const u of users) if (await earn(c, u.id, "milestone", `milestone:${milestoneId}`, 1)) n++; });
  return n;
}

async function todayBoard(limit = 10) {
  return (await db.query(`SELECT u.display_name AS name, pp.points FROM player_points pp JOIN users u ON u.id = pp.user_id
     WHERE pp.day = (now() AT TIME ZONE 'UTC')::date AND pp.points > 0 AND NOT u.is_banned ORDER BY pp.points DESC, u.created_at LIMIT $1`, [limit])).rows;
}

async function mine(userId) {
  const pending = (await db.query(`SELECT category, count(*)::int AS n FROM player_earnings WHERE user_id = $1 AND grant_id IS NULL GROUP BY category`, [userId])).rows;
  const paid = (await db.query(`SELECT g.award_amount_base_units::text AS lamports, g.payment_transaction_signature AS signature, g.payment_verified_at AS at
     FROM community_reward_grants g WHERE g.status = 'paid' AND g.recipient_wallet IN (SELECT address FROM wallet_accounts WHERE user_id = $1)
     ORDER BY g.payment_verified_at DESC LIMIT 20`, [userId])).rows;
  const pts = (await db.query(`SELECT points FROM player_points WHERE user_id = $1 AND day = (now() AT TIME ZONE 'UTC')::date`, [userId])).rows[0];
  return { pointsToday: pts ? pts.points : 0, pending, paid };
}

module.exports = { POINTS, LEADER_WEIGHTS, addPoints, earn, finalizeLeaderboards, milestoneReached, todayBoard, mine };
