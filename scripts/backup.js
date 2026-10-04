"use strict";
// JSON backup of game data. Excludes sessions, login nonces, and hashed IPs.
// Usage: DATABASE_URL=... node scripts/backup.js > backup.json
const TABLES = [
  "users", "wallet_accounts", "player_resources", "districts", "district_upgrades", "community_vault", "city_state",
  "game_rounds", "city_events", "event_votes", "leaderboard_snapshots", "cosmetics", "user_badges", "feature_flags", "app_settings",
];

async function exportData(db) {
  const out = { exportedAt: new Date().toISOString(), version: 1, tables: {} };
  for (const t of TABLES) out.tables[t] = (await db.query(`SELECT * FROM ${t}`)).rows;
  out.tables.resource_ledger_recent = (await db.query(`SELECT id, user_id, round_id, resource, delta, balance_after, reason, at FROM resource_ledger ORDER BY id DESC LIMIT 20000`)).rows;
  return out;
}

if (require.main === module) {
  const config = require("../server/config").load();
  if (!config.databaseUrl) { console.error("DATABASE_URL is required for backups."); process.exit(1); }
  const db = require("../server/db/pool");
  db.init(config).then(() => exportData(db)).then((d) => { process.stdout.write(JSON.stringify(d)); return db.close(); })
    .catch((e) => { console.error("backup failed:", e.message); process.exit(1); });
}

module.exports = { exportData, TABLES };
