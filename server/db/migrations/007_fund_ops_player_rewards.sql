-- One-tap Community Fund operations and player reward payouts.
--  * fund_ops: transactions the server BUILDS (unsigned) for a human to approve in their own wallet:
--      claim  = claim pump.fun creator rewards into the operator wallet
--      sweep  = move the Community Fund share (max 20%) from the operator wallet to the treasury
--      payout = pay players' earned rewards from the treasury
--    The server never holds a key. It only checks the signed transaction matches what it built, sends it,
--    and records results after Solana confirms them.
--  * player_points / player_earnings: what players earn through the game (daily leaderboard, Vault jackpot,
--    market-cap milestones). Earnings become grants only when a payout batch is prepared.

-- A single sweep / payout transaction can settle several allocations / grants, so one signature may repeat.
ALTER TABLE creator_reward_allocations DROP CONSTRAINT IF EXISTS creator_reward_allocations_community_transfer_signature_key;
ALTER TABLE community_fund_ledger      DROP CONSTRAINT IF EXISTS community_fund_ledger_transaction_signature_key;
ALTER TABLE community_reward_grants    DROP CONSTRAINT IF EXISTS community_reward_grants_payment_transaction_signature_key;
CREATE INDEX IF NOT EXISTS cra_transfer_sig ON creator_reward_allocations (community_transfer_signature);
CREATE INDEX IF NOT EXISTS crg_payment_sig ON community_reward_grants (payment_transaction_signature);

CREATE TABLE IF NOT EXISTS fund_ops (
  id              bigserial PRIMARY KEY,
  kind            text NOT NULL CHECK (kind IN ('claim','sweep','payout')),
  wallet          text NOT NULL,              -- the wallet that must sign (operator or treasury)
  amount_lamports numeric(39,0) NOT NULL DEFAULT 0,
  allocation_ids  bigint[] NOT NULL DEFAULT '{}',
  grant_ids       bigint[] NOT NULL DEFAULT '{}',
  program_id      bigint,
  operator_coin_id bigint,                    -- claim: the operator coin the claim was built for (verified claim match)
  tx_b64          text NOT NULL,
  signature       text UNIQUE,
  status          text NOT NULL DEFAULT 'built' CHECK (status IN ('built','sent','confirmed','finalized','failed','expired')),
  error           text,
  actor           text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fund_ops_status ON fund_ops (status, kind);

CREATE TABLE IF NOT EXISTS player_points (
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day      date NOT NULL,
  points   int NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
CREATE INDEX IF NOT EXISTS player_points_day ON player_points (day, points DESC);

CREATE TABLE IF NOT EXISTS player_earnings (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet      text NOT NULL,
  category    text NOT NULL CHECK (category IN ('leaderboard','vault','milestone')),
  ref         text NOT NULL,
  weight      numeric(12,4) NOT NULL CHECK (weight > 0),
  grant_id    bigint,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, ref, user_id)
);
CREATE INDEX IF NOT EXISTS player_earnings_pending ON player_earnings (category) WHERE grant_id IS NULL;
