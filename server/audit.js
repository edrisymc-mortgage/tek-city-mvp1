"use strict";
// Append-only audit log + public activity feed. Never pass secrets, cookies, or full signatures here.
const db = require("./db/pool");

const REDACT = /(secret|password|token|cookie|signature|private|seed|mnemonic)/i;
function scrub(details) {
  if (!details || typeof details !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(details)) {
    if (REDACT.test(k)) { out[k] = "[redacted]"; continue; }
    out[k] = v && typeof v === "object" && !Array.isArray(v) ? scrub(v) : v;
  }
  return out;
}

async function audit(client, { actorUserId = null, actorWallet = null, action, target = null, details = {}, ipHash = null }) {
  const q = client || db;
  await q.query(
    `INSERT INTO audit_logs (actor_user_id, actor_wallet, action, target, details, ip_hash) VALUES ($1,$2,$3,$4,$5,$6)`,
    [actorUserId, actorWallet, action, target, JSON.stringify(scrub(details)), ipHash]
  );
}

async function activity(client, kind, text) {
  await (client || db).query(`INSERT INTO city_activity (kind, text) VALUES ($1, $2)`, [kind, String(text).slice(0, 280)]);
}

async function flagAbuse(client, { userId = null, wallet = null, ipHash = null, reason, details = {} }) {
  const q = client || db;
  // de-duplicate: one open flag per reason+subject per hour
  const dup = await q.query(
    `SELECT 1 FROM abuse_flags WHERE reason = $1 AND status = 'open'
       AND user_id IS NOT DISTINCT FROM $2::uuid AND wallet IS NOT DISTINCT FROM $3::text AND ip_hash IS NOT DISTINCT FROM $4::text
       AND created_at > now() - interval '1 hour' LIMIT 1`,
    [reason, userId, wallet, ipHash]
  );
  if (dup.rowCount) return;
  await q.query(`INSERT INTO abuse_flags (user_id, wallet, ip_hash, reason, details) VALUES ($1,$2,$3,$4,$5)`,
    [userId, wallet, ipHash, reason, JSON.stringify(scrub(details))]);
}

module.exports = { audit, activity, flagAbuse, scrub };
