# TEK CITY (Beta)

A cooperative, server-authoritative online city-building game. Node.js + Express + Socket.IO + PostgreSQL, deployed on Render.

> Beta software. Not audited. Game resources are off-chain points with no monetary value.

## What it is
- One shared city, 96 rounds per UTC day, exactly 15 minutes each. The server closes, settles, and opens rounds on the wall clock.
- Players check in, ride the Transit Line (server-rolled d6), contribute Build Credits to 16 districts across 6 neighborhoods, vote on City Briefs, and contain escalating crises.
- Districts level 1 to 5; contributors are credited at level-up. 20% of every contribution fills the Community Vault; milestones unlock city-wide boosts and badges.
- Factions (Makers, Merchants, Residents) react to decisions. Daily goal: 36 district levels + 3 Vault milestones. Failure: Stability 0 (Blackout) or day ends Unfinished. Resets at 00:00 UTC; player resources, badges, and all-time Influence persist.
- No player ever loses resources because of another player.

## Run locally
```bash
npm install
npm run build      # bundles client/ into public/ (output is committed)
npm run dev        # http://localhost:3000, embedded Postgres if DATABASE_URL is empty
npm test           # 26 tests, embedded Postgres
```

## Environment
See `.env.example`. Required in production: `NODE_ENV=production`, `APP_URL`, `SESSION_SECRET` (32+ chars), `DATABASE_URL`.
Without `DATABASE_URL` the server falls back to an embedded, **non-persistent** Postgres and `/health` reports `"persistent": false`.

## Deploy (Render)
- Build: `npm install` · Start: `npm start` · Health check: `/health`
- Set `DATABASE_URL` to the Internal Database URL of the Render Postgres, and `SESSION_SECRET` via Render "Generate".
- Schema migrations run automatically on boot (`server/db/schema.sql`, idempotent).

## Wallet security model
- Wallets are optional identity only, via the Wallet Standard (`standard:connect`, `solana:signMessage`). Guest mode is fully playable.
- Sign-in: server issues a random single-use nonce (5 min) bound to address + session; the message includes "Sign in to TEK CITY", domain, address, nonce, issued/expiration time, and a statement that signing authorizes no transaction or transfer. The server verifies the ed25519 signature against the stored message and burns the nonce atomically.
- Sessions: opaque random token in an HttpOnly, Secure (prod), SameSite=Lax cookie (`__Host-` prefix in prod); only an HMAC is stored. CSRF token + Origin check on every state change. Session rotates on login. Admin actions require a fresh signature within 10 minutes.
- Never requested: seed phrases, private keys, transactions, approvals, transfers.

## What is NOT included
No token transfers, purchases, swaps, trading, custody, deposits, withdrawals, cash-out, or crypto prizes. No Pump.fun login or integration. `FEATURE_ONCHAIN_ACTIONS` and `FEATURE_MAINNET` are locked off unless set by environment. Rate limiting is in-memory (single instance); move it to Redis before scaling out.

See `docs/ARCHITECTURE.md`, `docs/LAUNCH_CHECKLIST.md`, `docs/INCIDENT_RESPONSE.md`.
