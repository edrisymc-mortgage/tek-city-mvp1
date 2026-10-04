# TEK CITY (Beta)

A 3D board game launchpad for Pump.fun coins on Solana. Node.js + Express + PostgreSQL, deployed on Render. The server is authoritative: it rolls the die, moves pawns, checks on-chain transactions and keeps every balance.

> Beta software. Not audited. TEK CITY tokens provide game utility only. They do not provide equity, dividends, revenue share, profit rights, ownership of Community Fund assets, or guaranteed financial returns.

## How it plays
- 24-space loop board. START and the Vault are fixed; the other spaces each hold one Pump.fun coin.
- Playing needs a connected Solana wallet (Phantom, Solflare, Backpack or any Wallet Standard wallet). Without one, visitors watch.
- 1 free spin per round per wallet. With `OFFICIAL_TOKEN_MINT` set and `SPIN_MODE=holder`, the wallet must hold `TOKENS_PER_SPIN` (500,000) tokens, re-checked on the server for every spin. Passing START or landing on the Vault: +1 spin. Market-cap milestones ($100K, $1M, $8M, $32M, $100M) grant bonus spins to every player. Milestones never move SOL or tokens.
- Empty space: launch a coin on Pump.fun. Taken space: buy into it with SOL, or take it over with a first buy at least as large as its biggest buy-in.

## Money flow
- Clients pay 100% of their own launches and buys from their own wallet. TEK CITY takes no percentage of launches, buys, balances or a client's creator rewards, and refuses to build any transaction that pays a TEK CITY wallet.
- Every transaction is built on the server, shown in a review (amount, fees, rent, programs, payer), signed in the user's wallet, then verified on chain (confirmed/finalized) before it's recorded. Settlement is idempotent per signature.
- Community Fund: only creator rewards that `OPERATOR_CREATOR_REWARD_WALLET` actually receives, for coins recorded in `operator_coins` and activated by an admin, count. 20% (floor, integer base units) is allocated to the fund; 80% plus the rounding remainder stays with the operator. Transfers to `COMMUNITY_TREASURY_WALLET` are sent by a human through a multisig and then verified on chain. The server holds no signer. See `docs/OPERATING_GUIDE.md`.

## Run locally
```bash
npm install
npm run build      # bundles client/ into public/ (output is committed)
npm run dev        # http://localhost:3000, embedded Postgres if DATABASE_URL is empty
npm test           # node:test, embedded Postgres, Solana RPC stubbed
```

## Environment
See `.env.example`. Production needs `NODE_ENV=production`, `APP_URL`, `SESSION_SECRET` (32+ chars), `DATABASE_URL`, `SOLANA_NETWORK=mainnet-beta`, `SOLANA_RPC_URL`, `PINATA_JWT`, `FEATURE_LAUNCHPAD=true`.

| Variable | Purpose |
| --- | --- |
| `OFFICIAL_TOKEN_MINT` | TEK CITY token mint, set after launch. Turns on the 500K holder check and milestones. |
| `OPERATOR_CREATOR_REWARD_WALLET` | Public key that receives creator rewards for TEK CITY-operated coins. |
| `COMMUNITY_TREASURY_WALLET` | Public key of the Community Fund treasury (multisig). |
| `COMMUNITY_FUND_ALLOCATION_BPS` / `OPERATOR_REWARD_RETAINED_BPS` | 2000 / 8000. Must sum to 10000. |
| `COMMUNITY_FUND_ENABLED` | `false` by default. Blocks program activation, grants and payouts. |
| `COMMUNITY_FUND_POLICY_URL` | Optional link to the full written policy. |
| `ADMIN_WALLET_ALLOWLIST`, `ADMIN_WALLET_ROLES` | Admin access and Community Fund roles. |

Invalid wallet config (bad key, operator = treasury, either = token mint, bps not summing to 10000) is logged at boot and forces the fund to disabled. `REWARDS_WALLET_SECRET` is retired and ignored; delete it from Render.

## Deploy (Render)
- Build: `npm install` · Start: `npm start` · Health check: `/health`
- Migrations in `server/db/migrations` run once each on boot (`004` resets the board to zero for the token launch).
- Pushes don't auto-deploy; trigger a deploy after merging to `main`.

## Security model
- Sign-in with Solana: single-use nonce bound to address + session, signed text message only, verified ed25519 on the server.
- HttpOnly session cookies, CSRF + Origin checks, rate limits, idempotency keys, append-only audit logs.
- Never requested, stored or transmitted: seed phrases, private keys, signing credentials. Wallet addresses aren't hard-coded in frontend code; the public Community Fund page reads them from the server.

See `docs/OPERATING_GUIDE.md`, `docs/TEST_REPORT.md`, `docs/ARCHITECTURE.md`, `docs/LAUNCH_CHECKLIST.md`, `docs/INCIDENT_RESPONSE.md`.
