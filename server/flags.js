"use strict";
// Feature flags. Crypto-related features default OFF; onchain_actions and mainnet are locked to env.
const db = require("./db/pool");
const { fail } = require("./security/util");

let cache = null;
let cacheAt = 0;

async function all(force = false) {
  if (!force && cache && Date.now() - cacheAt < 5000) return cache;
  const r = await db.query(`SELECT key, enabled, locked, description, updated_at FROM feature_flags ORDER BY key`);
  cache = Object.fromEntries(r.rows.map((f) => [f.key, f]));
  cacheAt = Date.now();
  return cache;
}
async function enabled(key) { const f = (await all())[key]; return !!(f && f.enabled); }

async function set(client, key, value, by) {
  const r = await client.query(`SELECT * FROM feature_flags WHERE key = $1 FOR UPDATE`, [key]);
  if (!r.rowCount) fail(404, "unknown_flag", "Unknown feature flag.");
  const f = r.rows[0];
  if (f.locked) fail(403, "flag_locked", "This flag is locked by server configuration and cannot be changed here.");
  await client.query(`UPDATE feature_flags SET enabled = $2, updated_at = now(), updated_by = $3 WHERE key = $1`, [key, !!value, by]);
  cache = null;
  return { key, enabled: !!value };
}

// Guard for any future chain-touching route. Both flags must be on, and mainnet additionally requires its own flag.
async function assertOnchainAllowed({ mainnet = false } = {}) {
  const f = await all(true);
  if (!f.onchain_actions || !f.onchain_actions.enabled) fail(403, "feature_disabled", "On-chain actions are disabled in this beta.");
  if (mainnet && (!f.mainnet || !f.mainnet.enabled)) fail(403, "feature_disabled", "Mainnet is disabled.");
}

function clearCache() { cache = null; }

module.exports = { all, enabled, set, assertOnchainAllowed, clearCache };
