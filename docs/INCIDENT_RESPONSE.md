# Incident response

## Emergency pause
Admin console (`/admin`) -> "Emergency pause" (requires allowlisted wallet + fresh signature). Pauses all game actions and settlement; the site shows a banner. Resume from the same screen. If admin is unavailable, set the service to suspended in Render.

## Phishing / impersonation
1. Confirm the report (`/admin` -> support reports, kind `scam`).
2. Post a warning via Admin -> Announcement and on official socials.
3. Report the domain to the registrar/host, Google Safe Browsing, and wallet providers' phishing lists.
4. Re-state on Official Links: TEK CITY never asks for seed phrases, private keys, or transactions.

## Login abuse (signature floods, account farming)
1. Review abuse flags (`signature_failures`, `rate_limit_repeat`, `guest_cap`).
2. Ban offending accounts from the abuse flag (revokes all sessions).
3. Tighten limits in `server/security/rateLimit.js` / `app_settings` and redeploy.
4. If needed, set `FEATURE_WALLET_CONNECT=false` (guest play continues).

## API abuse / DDoS
1. Check Render metrics and logs (`[error <ref>]` lines carry a reference id, never secrets).
2. Enable Render/edge rate limiting or a WAF; pause the city if settlement is affected.

## Data issues
`npm run backup` (or Admin -> Download JSON backup) before any manual fix. Ledgers are append-only; correct balances with new compensating entries, never edits.
