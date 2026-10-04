"use strict";
// Central configuration. Every value comes from the environment; nothing secret is ever sent to the client.
const crypto = require("crypto");

const bool = (v, d = false) => (v === undefined || v === "" ? d : /^(1|true|yes|on)$/i.test(String(v)));
const int = (v, d) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? d : Math.trunc(Number(v)));
const list = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);

function load(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const isProd = nodeEnv === "production";
  const port = int(env.PORT, 3000);
  const appUrl = (env.APP_URL || (isProd ? "" : `http://localhost:${port}`)).replace(/\/+$/, "");
  const warnings = [];

  let sessionSecret = env.SESSION_SECRET || "";
  let sessionSecretEphemeral = false;
  if (sessionSecret.length < 32) {
    if (isProd) warnings.push("SESSION_SECRET missing or shorter than 32 chars: using an ephemeral secret. Sessions reset on restart.");
    sessionSecret = crypto.randomBytes(48).toString("hex");
    sessionSecretEphemeral = true;
  }
  if (isProd && !appUrl) warnings.push("APP_URL is not set. Sign-in messages and CORS will use the request host.");

  const allowedOrigins = new Set(list(env.ALLOWED_ORIGINS));
  if (appUrl) allowedOrigins.add(new URL(appUrl).origin);
  if (!isProd) ["http://localhost:3000", "http://127.0.0.1:3000", `http://localhost:${port}`].forEach((o) => allowedOrigins.add(o));

  const network = ["devnet", "testnet", "mainnet-beta"].includes(env.SOLANA_NETWORK) ? env.SOLANA_NETWORK : "devnet";
  const envMainnet = bool(env.FEATURE_MAINNET, false);
  const envOnchain = bool(env.FEATURE_ONCHAIN_ACTIONS, false);

  return {
    nodeEnv, isProd, isTest: nodeEnv === "test", port, appUrl,
    apiUrl: (env.API_URL || appUrl).replace(/\/+$/, ""),
    sessionSecret, sessionSecretEphemeral,
    databaseUrl: env.DATABASE_URL || "",
    databaseSsl: bool(env.DATABASE_SSL, /render\.com/.test(env.DATABASE_URL || "")),
    redisUrl: env.REDIS_URL || "",
    sentryDsn: env.SENTRY_DSN || "",
    allowedOrigins,
    solana: {
      // Mainnet is never used unless both FEATURE_MAINNET and FEATURE_ONCHAIN_ACTIONS are explicitly enabled.
      network: network === "mainnet-beta" && !(envMainnet && envOnchain) ? "devnet" : network,
      rpcUrl: env.SOLANA_RPC_URL || "", // server-side only, never exposed
    },
    adminWallets: list(env.ADMIN_WALLET_ALLOWLIST),
    launchpad: {
      enabled: bool(env.FEATURE_LAUNCHPAD, false),
      pumpApi: (env.PUMP_API_URL || "https://fun-block.pump.fun").replace(/\/+$/, ""),
      rpcUrl: env.SOLANA_RPC_URL || "https://rpc.solanatracker.io/public", // server-side only
      pinataJwt: env.PINATA_JWT || "", // secret, server-side only
      communityWallet: env.COMMUNITY_REWARDS_WALLET || "",
      launcherBps: int(env.LAUNCHER_FEE_BPS, 8000),
      maxBuyLamports: int(env.MAX_BUY_LAMPORTS, 800_000_000), // ~ $100 at $121/SOL
      minBuyLamports: int(env.MIN_BUY_LAMPORTS, 10_000_000), // 0.01 SOL
      xpPerSol: int(env.XP_PER_SOL, 1000),
    },
    rewards: {
      // Dedicated hot wallet that receives the community fee share and pays holders hourly. Secret stays server-side.
      walletSecret: env.REWARDS_WALLET_SECRET || "",
      reserveLamports: int(env.REWARDS_RESERVE_LAMPORTS, 50_000_000),
      maxPerHourLamports: int(env.REWARDS_MAX_PER_HOUR_LAMPORTS, 2_000_000_000),
      minPayoutLamports: int(env.REWARDS_MIN_PAYOUT_LAMPORTS, 1_000_000),
      topHolders: int(env.REWARDS_TOP_HOLDERS, 25),
      jackpotBps: int(env.JACKPOT_BPS, 6000), // share of the pool won by landing on the Community Vault
      hourlyBps: int(env.HOURLY_BPS, 2000), // share of the remaining pool paid to holders each hour
    },
    spins: {
      mint: env.OFFICIAL_TOKEN_MINT || "",
      tokensPerSpin: int(env.TOKENS_PER_SPIN, 500_000),
    },
    officialTokenMint: env.OFFICIAL_TOKEN_MINT || "",
    official: {
      x: env.OFFICIAL_X_URL || "",
      discord: env.OFFICIAL_DISCORD_URL || "",
      telegram: env.OFFICIAL_TELEGRAM_URL || "",
      auditStatus: env.OFFICIAL_AUDIT_STATUS || "",
      supportEmail: env.SUPPORT_EMAIL || "",
    },
    flagsFromEnv: {
      wallet_connect: bool(env.FEATURE_WALLET_CONNECT, true),
      market_data: bool(env.FEATURE_MARKET_DATA, false),
      onchain_actions: envOnchain,
      mainnet: envMainnet && envOnchain,
    },
    game: {
      roundMinutes: int(env.ROUND_MINUTES, 15),
      roundsPerDay: 96,
      tickCheckMs: int(env.TICK_CHECK_MS, 5000),
      dayGoalLevels: int(env.DAY_GOAL_LEVELS, 36),
      dayGoalVaultMilestones: int(env.DAY_GOAL_VAULT_MILESTONES, 3),
    },
    session: {
      anonTtlMs: 24 * 3600e3,
      guestTtlMs: 7 * 24 * 3600e3,
      walletTtlMs: 12 * 3600e3,
      reauthWindowMs: 10 * 60e3,
    },
    nonceTtlMs: 5 * 60e3,
    trustProxy: int(env.TRUST_PROXY, isProd ? 1 : 0),
    warnings,
  };
}

module.exports = { load, bool, int, list };
