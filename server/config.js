"use strict";
// Central configuration. Every value comes from the environment; nothing secret is ever sent to the client.
const crypto = require("crypto");

const bool = (v, d = false) => (v === undefined || v === "" ? d : /^(1|true|yes|on)$/i.test(String(v)));
const int = (v, d) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? d : Math.trunc(Number(v)));
const list = (v) => String(v || "").split(",").map((s) => s.trim()).filter(Boolean);

// Validates the Community Fund wallets: real Solana public keys, all distinct, never the token mint.
const ROLES = ["coin_approver", "policy_admin", "program_admin", "grant_approver", "ledger_reconciler"];

function communityFund(env) {
  const { normalizeAddress } = require("./auth/address");
  const op = (env.OPERATOR_CREATOR_REWARD_WALLET || "").trim(), tr = (env.COMMUNITY_TREASURY_WALLET || "").trim(), mint = (env.OFFICIAL_TOKEN_MINT || "").trim();
  const intStr = (v, d) => (v === undefined || v === "" ? d : /^\d+$/.test(String(v).trim()) ? Number(String(v).trim()) : NaN);
  const bpsC = intStr(env.COMMUNITY_FUND_ALLOCATION_BPS, 2000), bpsO = intStr(env.OPERATOR_REWARD_RETAINED_BPS, 8000);
  const errors = [];
  const opOk = !op || normalizeAddress(op) === op, trOk = !tr || normalizeAddress(tr) === tr;
  if (!opOk) errors.push("OPERATOR_CREATOR_REWARD_WALLET is not a valid Solana public key");
  if (!trOk) errors.push("COMMUNITY_TREASURY_WALLET is not a valid Solana public key");
  if (op && tr && op === tr) errors.push("OPERATOR_CREATOR_REWARD_WALLET and COMMUNITY_TREASURY_WALLET must be different");
  if (mint && (mint === op || mint === tr)) errors.push("OFFICIAL_TOKEN_MINT must not equal either wallet address");
  if (!Number.isInteger(bpsC) || !Number.isInteger(bpsO) || bpsC + bpsO !== 10000) errors.push("COMMUNITY_FUND_ALLOCATION_BPS and OPERATOR_REWARD_RETAINED_BPS must be non-negative integers summing to 10000");
  if (env.REWARDS_WALLET_SECRET) errors.push("REWARDS_WALLET_SECRET is set but ignored. Delete it from Render: the server must not hold a signer");
  const blocking = errors.filter((e) => !e.startsWith("REWARDS_WALLET_SECRET"));
  return {
    operatorWallet: opOk ? op : "", treasuryWallet: trOk ? tr : "",
    communityBps: Number.isInteger(bpsC) ? bpsC : 2000, operatorBps: Number.isInteger(bpsO) ? bpsO : 8000,
    enabled: String(env.COMMUNITY_FUND_ENABLED || "false").trim().toLowerCase() === "true" && blocking.length === 0,
    paused: String(env.COMMUNITY_FUND_PAUSED || "false").trim().toLowerCase() === "true",
    policyUrl: /^https:\/\/[^\s<>"]+$/.test(env.COMMUNITY_FUND_POLICY_URL || "") ? env.COMMUNITY_FUND_POLICY_URL : "",
    errors,
    // accounting (detect + calculate, never transfer) runs only when both wallets are set and the config is valid
    accounting: !!op && !!tr && blocking.length === 0,
  };
}

function load(env = process.env) {
  const nodeEnv = env.NODE_ENV || "development";
  const isProd = nodeEnv === "production";
  const port = int(env.PORT, 3000);
  const appUrl = (env.APP_URL || (isProd ? "" : `http://localhost:${port}`)).replace(/\/+$/, "");
  const warnings = [];

  let sessionSecret = env.WALLET_AUTH_SECRET || env.SESSION_SECRET || ""; // HMAC key for session tokens (wallet + guest)
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
    adminRoles: String(env.ADMIN_WALLET_ROLES || "").split(";").map((x) => x.trim()).filter(Boolean).map((x) => {
      const [address, r = ""] = x.split(":");
      return { address: address.trim(), roles: r.split("|").map((y) => y.trim()).filter((y) => ROLES.includes(y)) };
    }),
    launchpad: {
      enabled: bool(env.FEATURE_LAUNCHPAD, false),
      pumpApi: (env.PUMP_API_URL || "https://fun-block.pump.fun").replace(/\/+$/, ""),
      rpcUrl: env.SOLANA_RPC_URL || "https://rpc.solanatracker.io/public", // server-side only
      pinataJwt: env.PINATA_JWT || "", // secret, server-side only
      maxBuyLamports: int(env.MAX_BUY_LAMPORTS, 800_000_000), // ~ $100 at $121/SOL
      minBuyLamports: int(env.MIN_BUY_LAMPORTS, 10_000_000), // 0.01 SOL
      xpPerSol: int(env.XP_PER_SOL, 1000),
      // SOL kept back for network fees + rent for new accounts (token account, bonding curve, metadata).
      launchReserveLamports: int(env.LAUNCH_RESERVE_LAMPORTS, 30_000_000), // 0.03 SOL
      buyReserveLamports: int(env.BUY_RESERVE_LAMPORTS, 5_000_000), // 0.005 SOL
      pumpBioLink: bool(env.FEATURE_PUMP_BIO_LINK, false), // off: identity only from wallet signatures
      // Any TEK CITY-controlled wallet, including the retired rewards wallet. Player transactions touching these are refused.
      blockedRecipients: [...new Set(["9TECpxWaTJnsYFSP4fmG6qS4DN21LwJc6yfygLDxHVHa", ...list(env.TEK_CITY_WALLETS)])],
    },
    // Creator-reward Community Fund. Public addresses only: the server never holds a signer for any of these.
    // Allocations are accounting records; the actual 20% transfer is signed through the external multisig.
    communityFund: communityFund(env),
    spins: {
      mint: env.OFFICIAL_TOKEN_MINT || "",
      tokensPerSpin: int(env.TOKENS_PER_SPIN, 500_000),
      // "holder": with OFFICIAL_TOKEN_MINT set, 1 free spin per round only while the wallet holds >= TOKENS_PER_SPIN.
      // "bought": 1 spin per TOKENS_PER_SPIN bought (on-chain buys signed by the player's wallet).
      // "bought" (default): 1 free starter spin per player, then 1 spin per TOKENS_PER_SPIN bought (verified on-chain
      // buys signed by a connected wallet or a verified pump.fun profile wallet). Spins don't refill for holding.
      mode: ["holder", "owned"].includes(env.SPIN_MODE) ? env.SPIN_MODE : "bought",
      // first spin free for every player ("owned" and "bought" modes)
      starterSpins: Math.max(0, int(env.STARTER_SPINS, 1)),
    },
    vault: { cooldownHours: Math.max(0, int(env.VAULT_COOLDOWN_HOURS, 12)), spins: Math.max(0, int(env.VAULT_JACKPOT_SPINS, 1)) },
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
