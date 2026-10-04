"use strict";
const config = require("./config").load();
const { createApp } = require("./app");

(async () => {
  for (const w of config.warnings) console.warn("[config]", w);
  const t = await createApp(config);
  if (t.dbMode !== "external") console.warn("[db] DATABASE_URL not set: using embedded, NON-PERSISTENT Postgres. Data resets on restart.");
  t.server.listen(config.port, () => console.log(`TEK CITY (beta) listening on :${config.port} (${config.nodeEnv}, solana ${config.solana.network})`));
  const stop = async (sig) => { console.log(`[${sig}] shutting down`); try { await t.close(); } finally { process.exit(0); } };
  process.on("SIGTERM", () => stop("SIGTERM"));
  process.on("SIGINT", () => stop("SIGINT"));
})().catch((e) => {
  console.error("fatal startup error:", e.message);
  process.exit(1);
});
