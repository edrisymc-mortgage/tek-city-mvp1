# Community Fund operating guide (internal)

The server records and verifies. It never signs or sends. Every action below is in `/admin` (or the matching
`/api/admin/community/*` route), needs an allowlisted admin wallet, a fresh sign-in within 10 minutes, and the role
shown. Every action is written to the append-only audit log. Never paste a private key or seed phrase anywhere.

Roles come from `ADMIN_WALLET_ROLES` (for example `YourAdminAddress:coin_approver|ledger_reconciler|program_admin|grant_approver|policy_admin`).

## 1. Add an eligible coin (coin_approver)
Only coins TEK CITY itself operates, whose creator rewards go to `OPERATOR_CREATOR_REWARD_WALLET`. Never a player's coin.
1. `POST /community/coins` with `mint`, `tokenName`, `tokenSymbol`, `launchVenue` (`pump.fun` or `pumpswap`). Created as `draft` on the configured network and operator wallet.
2. Review it, then `POST /community/coins/:id/status` `approved`, then `active`. Rewards are only counted while `active`. Use `paused` or `retired` to stop.

## 2. Verify receipt (automatic, ledger_reconciler to re-check)
Every 5 minutes the server reads the operator wallet's recent transactions from `SOLANA_RPC_URL` and records creator-reward receipts: successful, finalized, Pump.fun program involved, recipient = operator wallet, amount from chain balances, matched to an active operator coin.
- `detected`: seen, waiting for finalization or a coin match. Use `POST /community/events/:id/match` with `operatorCoinId` when a claim covered a coin the server couldn't identify.
- `confirmed`: verified; allocation created.
- `rejected`: failed transaction, unsupported asset, or not an eligible operator coin (reason stored).
- `POST /community/rescan` with an optional `signature` re-checks now.

## 3. Reconcile 20/80 (automatic, ledger_reconciler reviews)
Each confirmed event gets exactly one allocation: community = floor(amount × 2000 / 10000), operator = the rest. Integer base units (lamports for SOL). The fund ledger row starts as `accrued`. Accrued is accounting only, not money in the treasury. If an event was wrong, `POST /community/events/:id/reverse` with a reason (only before a transfer is recorded).

## 4. Send the 20% through the multisig (human)
1. `POST /community/allocations/:id/propose-transfer`. Returns the exact asset, amount, from (operator wallet) and to (treasury). Status becomes `awaiting_multisig_transfer` / ledger `transfer_proposed`.
2. A human sends exactly that amount from the operator wallet to the treasury using their own wallet or multisig. The server takes no part in signing.

## 5. Record and verify the transfer (ledger_reconciler)
`POST /community/allocations/:id/verify-transfer` with the transaction signature. The server checks on chain: success, sender, treasury recipient, amount at least the allocation, signature not already used.
- Confirmed but not finalized: `transferred`. The server re-checks every 5 minutes.
- Finalized: `verified` with `transfer_verified_at`. Only then does it count as "verified at treasury" on the public page.

## 6. Programs and grants
- Programs (program_admin): `POST /community/programs` with name, purpose, description, eligibility rules, fraud controls, asset, budget, start/end. Then status `proposed` → `approved` → `active`. Activation is refused while `COMMUNITY_FUND_ENABLED=false`.
- Grants (program_admin or grant_approver): `POST /community/grants` with program, recipient, amount and a proof reference. Refused unless the fund is enabled and the program is active, inside its dates and within budget. Never to TEK CITY wallets.
- Approve (grant_approver): status `approved` then `payment_proposed`.
- Pay (human, multisig): send from the treasury to the recipient.
- Verify (grant_approver): `POST /community/grants/:id/verify-payment` with the signature. Must be finalized, treasury → recipient, at least the award. Only then is the grant `paid` and shown publicly.

## Policy text (policy_admin)
`POST /community/policies` adds a new version of a disclosure (`client_launch_disclosure`, `community_fund_disclosure`, `community_fund_model`, `token_utility_disclosure`). Versions can't be edited or deleted; the newest one is shown.

## Never
- Enable the fund, move funds, or publish financial or promotional claims without explicit owner approval.
- Show accrued amounts as received, or enter a signature that isn't real.
- Count rewards from a player's coin, or from any coin that isn't `active` in `operator_coins`.
