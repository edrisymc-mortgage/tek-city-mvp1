# Test report

Run: `npm test` (node:test, embedded Postgres, Solana RPC stubbed). Date: 2026-10-04. Result: **65 passed, 0 failed**.

Covers wallet sign-in (SIWS nonce), wallet-only play (no guest play), multi-wallet buy/launch flow (balance check, review, idempotent settlement, tampered/failed/expired transactions, confirmation timeout), spin rules (starter spin, 1 spin per 500K bought including buys from a linked pump.fun profile, 12-hour Vault jackpot cooldown, optional holder/owned modes), and the creator-reward Community Fund (operator-coin matching, a client's own reward never ingested, unapproved coins rejected, 20/80 integer split, finalization, idempotency, reversal, immutability, multisig transfer verification, disabled-flag blocks, grants refused outside an active program, RBAC, no holder entitlement, no server signer).

Not covered by automated tests: real mainnet transactions and real wallet extensions. Those need a manual check with a small amount after deploy.

## Tests
- PASS: address normalization accepts only canonical 32-byte base58 keys
- PASS: nonce message contains the required sign-in statement fields
- PASS: valid signature signs in, sets a secure HttpOnly session, and rotates the session
- PASS: nonce reuse, expiry, bad signature, and address mismatch are rejected
- PASS: a browser-provided address alone is never treated as authenticated
- PASS: guest mode works and a guest can link a wallet once
- PASS: sessions expire and logout revokes
- PASS: CSRF and Origin checks reject unauthorized state changes
- PASS: rate limits block nonce floods and record events
- PASS: malformed input is rejected safely
- PASS: feature flags: mainnet and on-chain actions are locked off
- PASS: admin API is disabled when no allowlist is configured
- PASS: security headers: CSP, frame denial, no x-powered-by
- PASS: integer split: 20% community, 80% operator, remainder stays with operator
- PASS: config validation keeps the three addresses separate and rejects server-held signers
- PASS: a finalized 1.00 SOL reward on an approved operator coin allocates 0.20 / 0.80
- PASS: a client's own coin reward is never ingested
- PASS: unapproved (draft) operator coins are rejected until an admin activates them
- PASS: unmatched rewards wait for an admin match and never allocate on their own
- PASS: operator claiming its own reward counts the fee it paid back in
- PASS: no allocation until the receipt is finalized
- PASS: duplicate processing never duplicates events or allocations
- PASS: failed transactions and non-Pump receipts never fund the Community Fund
- PASS: reversed rewards reverse their allocation and ledger row; amounts are immutable
- PASS: transfer: propose -> human multisig send -> verified on chain (confirmed = transferred, finalized = verified)
- PASS: public page: Not Active, separate totals, wallets from server config, disclosures, no fake signatures
- PASS: disabled flag blocks program activation, grants and payments
- PASS: grants are refused outside an active program (enabled fund)
- PASS: RBAC: admins without a role can't touch Community Fund records
- PASS: holding TEK CITY gives no entitlement to Community Fund assets
- PASS: the server has no way to sign or send Community Fund transfers
- PASS: check-in is once per round and rewards are decided by the server
- PASS: move: server rolls, spends energy, cannot be replayed into extra moves
- PASS: idempotency key cannot be reused for a different action
- PASS: concurrent duplicate requests apply exactly once
- PASS: contributions are validated against server balances and per-round limits
- PASS: settlement levels up districts, credits contributors, and runs exactly once under concurrency
- PASS: actions against a closed round are rejected
- PASS: votes are tallied and the majority option is applied at settlement
- PASS: ledger and audit logs are append-only
- PASS: no stop ever takes resources from a player (beyond the move cost)
- PASS: admin requires allowlisted wallet + fresh re-auth; pause blocks actions; all logged
- PASS: public state exposes no secrets and includes board, vault, leaderboard
- PASS: /home/user/workspace/tek-city-mvp1/test/helpers.js
- PASS: guests can't spin once the token is live
- PASS: wallets under 500,000 TEK CITY get no free spin
- PASS: holders get exactly one free spin per round, balance re-read server-side
- PASS: launchpad info and state expose coins without secrets
- PASS: launch requires a linked wallet and being on the space
- PASS: submit rejects unknown or foreign intents
- PASS: before OFFICIAL_TOKEN_MINT is set, every player gets 1 free spin per round
- PASS: link a pump.fun profile by bio code; its TEK CITY buys count for spins
- PASS: first spin is free, then 1 spin per 500,000 TEK CITY bought
- PASS: starter spin, then 1 per 500K owned per round
- PASS: Vault jackpot pays once per 12 hours across the board
- PASS: insufficient SOL is rejected before anything is built
- PASS: buy returns a review, settles once, and duplicates are never credited
- PASS: a tampered transaction is refused and nothing is sent
- PASS: signing rejected in the wallet: an unsubmitted request credits nothing
- PASS: a transaction that fails on chain is recorded as failed and credits nothing
- PASS: preflight rejection (e.g. not enough SOL at send time) is a clear error
- PASS: a dropped transaction times out, then expires without credit
- PASS: a timed-out transaction that later confirms is credited exactly once
- PASS: an expired request can't be submitted
- PASS: launch: wallet pays, review shown, launch persisted from prepared to placed
