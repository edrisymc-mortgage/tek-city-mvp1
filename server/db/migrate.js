"use strict";
const fs = require("fs");
const path = require("path");
const db = require("./pool");
const { DISTRICT_STOPS } = require("../game/board");
const { normalizeAddress } = require("../auth/address");

const FLAG_DEFS = {
  wallet_connect: "Optional Solana wallet sign-in for player identity (signature only, no transactions).",
  market_data: "Read-only market data module (informational only). Disabled in beta.",
  onchain_actions: "Any on-chain transaction feature. Locked off unless enabled by environment and separately reviewed.",
  mainnet: "Use Solana mainnet. Locked off unless enabled by environment and separately reviewed.",
};

const COSMETICS = [
  ["first-brick", "First Brick", "Made your first district contribution."],
  ["crew-chief", "Crew Chief", "Contributed to a district level-up."],
  ["vault-keeper", "Vault Keeper", "Active when the Community Vault reached a milestone."],
  ["city-thrives", "City Thrives", "Helped the city hit its daily goal."],
  ["crisis-crew", "Crisis Crew", "Helped contain a city crisis."],
  ["verified-builder", "Verified Builder", "Linked a wallet with a signed sign-in message."],
];

async function migrate(config) {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await db.query(sql);
  await db.tx(async (c) => {
    for (const s of DISTRICT_STOPS) {
      await c.query(
        `INSERT INTO districts (id, slug, name, neighborhood) VALUES ($1,$2,$3,$4)
         ON CONFLICT (id) DO UPDATE SET slug = EXCLUDED.slug, name = EXCLUDED.name, neighborhood = EXCLUDED.neighborhood`,
        [s.id, s.slug, s.name, s.hood]
      );
    }
    await c.query(`INSERT INTO community_vault (id) VALUES (1) ON CONFLICT DO NOTHING`);
    await c.query(`INSERT INTO city_state (id, day) VALUES (1, (now() AT TIME ZONE 'UTC')::date) ON CONFLICT DO NOTHING`);
    for (const [key, description] of Object.entries(FLAG_DEFS)) {
      const envVal = !!config.flagsFromEnv[key];
      // onchain_actions and mainnet are locked to their environment value; admins cannot turn them on.
      const locked = key === "onchain_actions" || key === "mainnet";
      await c.query(
        `INSERT INTO feature_flags (key, enabled, locked, description) VALUES ($1,$2,$3,$4)
         ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description, locked = EXCLUDED.locked,
           enabled = CASE WHEN EXCLUDED.locked THEN EXCLUDED.enabled ELSE feature_flags.enabled END`,
        [key, envVal, locked, description]
      );
    }
    // env can always force wallet_connect / market_data off
    for (const key of ["wallet_connect", "market_data"]) {
      if (!config.flagsFromEnv[key]) await c.query(`UPDATE feature_flags SET enabled = false WHERE key = $1`, [key]);
    }
    for (const [id, name, description] of COSMETICS) {
      await c.query(`INSERT INTO cosmetics (id, name, description) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING`, [id, name, description]);
    }
    await c.query(`INSERT INTO app_settings (key, value) VALUES ('max_wallets_per_account', '1'::jsonb) ON CONFLICT DO NOTHING`);
    await c.query(`INSERT INTO app_settings (key, value) VALUES ('max_guest_accounts_per_ip_per_day', '10'::jsonb) ON CONFLICT DO NOTHING`);
    await c.query(`DELETE FROM admin_wallets WHERE source = 'env'`);
    for (const raw of config.adminWallets) {
      const a = normalizeAddress(raw);
      if (a) await c.query(`INSERT INTO admin_wallets (address, source) VALUES ($1, 'env') ON CONFLICT DO NOTHING`, [a]);
    }
  });
}

if (require.main === module) {
  const config = require("../config").load();
  db.init(config).then(() => migrate(config)).then(() => { console.log("migrations applied"); return db.close(); })
    .catch((e) => { console.error("migration failed:", e.message); process.exit(1); });
}

module.exports = { migrate, FLAG_DEFS };
