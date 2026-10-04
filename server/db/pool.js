"use strict";
// Postgres access. Uses DATABASE_URL when present; otherwise boots an embedded Postgres
// (development/test only, or a clearly-flagged non-persistent fallback in production).
const path = require("path");
const fs = require("fs");
const { Pool, types } = require("pg");
// Return DATE columns as plain YYYY-MM-DD strings (game days are UTC calendar days).
types.setTypeParser(1082, (v) => v);
// BIGINT ids as strings are fine; counts are cast to int in SQL.

let pool = null;
let embedded = null;
let mode = "none";

async function startEmbedded({ dir, port }) {
  let EmbeddedPostgres;
  try { EmbeddedPostgres = require("embedded-postgres").default || require("embedded-postgres"); }
  catch { throw new Error("DATABASE_URL is not set and embedded-postgres is not installed."); }
  const password = require("crypto").randomBytes(16).toString("hex");
  fs.rmSync(dir, { recursive: true, force: true });
  embedded = new EmbeddedPostgres({
    databaseDir: dir, user: "tekcity", password, port, persistent: false,
    initdbFlags: ["--locale=C", "--lc-messages=C", "--encoding=UTF8"],
    onLog: () => {}, onError: () => {},
    createPostgresUser: typeof process.getuid === "function" && process.getuid() === 0,
  });
  await embedded.initialise();
  await embedded.start();
  return `postgres://tekcity:${password}@127.0.0.1:${port}/postgres`;
}

async function init(config, opts = {}) {
  let url = config.databaseUrl;
  if (!url) {
    const port = opts.embeddedPort || 54000 + Math.floor(Math.random() * 900);
    url = await startEmbedded({ dir: opts.embeddedDir || path.join(require("os").tmpdir(), `tekcity-pg-${port}`), port });
    mode = "embedded";
  } else mode = "external";
  pool = new Pool({
    connectionString: url,
    max: opts.max || 10,
    ssl: mode === "external" && config.databaseSsl ? { rejectUnauthorized: false } : undefined,
    idleTimeoutMillis: 30000,
  });
  pool.on("error", (e) => console.error("[db] idle client error:", e.code || "unknown"));
  await pool.query("SELECT 1");
  return { mode };
}

const query = (text, params) => pool.query(text, params);

// Run fn inside a transaction. Retries serialization/deadlock failures a few times.
async function tx(fn, { retries = 3 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const out = await fn(client);
      await client.query("COMMIT");
      return out;
    } catch (e) {
      try { await client.query("ROLLBACK"); } catch { /* ignore */ }
      if ((e.code === "40001" || e.code === "40P01") && attempt < retries) continue;
      throw e;
    } finally {
      client.release();
    }
  }
}

async function close() {
  if (pool) await pool.end().catch(() => {});
  pool = null;
  if (embedded) await embedded.stop().catch(() => {});
  embedded = null;
}

module.exports = { init, query, tx, close, getMode: () => mode, getPool: () => pool };
