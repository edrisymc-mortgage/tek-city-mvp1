# Architecture

```
browser (static pages + bundled JS) --HTTPS REST--> Express API --pg--> PostgreSQL
          ^                                              |
          +------------- Socket.IO (server->client "city changed" pings only)
```

- `server/app.js`: middleware order: HTTPS redirect, Helmet (strict CSP, HSTS), Permissions-Policy, strict CORS, JSON body (10 kB), session loader, routes, static files, safe error handler. Round scheduler checks every 5 s.
- `server/game/engine.js`: all game rules. Every action runs in one DB transaction: open round `FOR SHARE`, idempotency insert into `player_actions` (unique per user+key), player row `FOR UPDATE`, validation, balance changes recorded in the append-only `resource_ledger`.
- Settlement: `city_state FOR UPDATE` + open round `FOR UPDATE`, status `open -> settling -> settled`, resolves the City Brief vote or crisis, applies level-ups and contributor credit, neighborhood production, energy regen, Vault milestones, win/fail checks, leaderboard snapshot, day rollover, then opens the next round. A partial unique index guarantees at most one open round.
- `server/auth/*`: base58 address normalization, SIWS-style nonce + ed25519 verify, server-side sessions.
- `server/security/*`: rate limits (per IP / user / wallet; blocks recorded, repeat offenders flagged), validators, HMAC helpers.
- `audit_logs` and `resource_ledger` are append-only (trigger rejects UPDATE/DELETE). Secrets, cookies, and signatures are redacted.
- Feature flags in `feature_flags`; `onchain_actions` and `mainnet` are locked to env values.
