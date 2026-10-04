-- Creator-reward Community Fund accounting.
-- Records only: the server holds no signer for any wallet. Transfers and payments are signed through an external
-- multisig / secure wallet, then verified on chain here. All amounts are integer base units (lamports for SOL).
-- Every change is also written to audit_logs (append-only, see schema.sql).

-- Coins TEK CITY itself operates. Only these can produce creator rewards that feed the Community Fund.
CREATE TABLE IF NOT EXISTS operator_coins (
  id                         bigserial PRIMARY KEY,
  mint_address_or_launch_id  text NOT NULL UNIQUE,
  token_name                 text NOT NULL,
  token_symbol               text NOT NULL,
  launch_venue               text NOT NULL CHECK (launch_venue IN ('pump.fun','pumpswap')),
  network                    text NOT NULL CHECK (network IN ('mainnet-beta','devnet')),
  operator_reward_wallet     text NOT NULL,
  eligibility_status         text NOT NULL DEFAULT 'draft' CHECK (eligibility_status IN ('draft','approved','active','paused','retired')),
  policy_version             text NOT NULL,
  configured_by_admin_id     text NOT NULL,
  configured_at              timestamptz NOT NULL DEFAULT now(),
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS creator_reward_events (
  id                            bigserial PRIMARY KEY,
  operator_coin_id              bigint REFERENCES operator_coins(id),
  source_type                   text NOT NULL CHECK (source_type IN ('onchain_transfer','launchpad_event','verified_claim')),
  source_event_id               text NOT NULL UNIQUE,
  source_transaction_signature  text,
  reward_recipient_wallet       text NOT NULL,
  asset_mint                    text NOT NULL,             -- 'SOL' for native lamports, else the SPL mint
  reward_amount_base_units      numeric(39,0) NOT NULL CHECK (reward_amount_base_units >= 0),
  received_slot                 bigint,
  received_at                   timestamptz,
  verification_status           text NOT NULL DEFAULT 'detected' CHECK (verification_status IN ('detected','confirmed','rejected','reversed')),
  rejection_reason              text,
  raw_event_hash_or_reference   text,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),
  CHECK (verification_status <> 'confirmed' OR (operator_coin_id IS NOT NULL AND reward_amount_base_units > 0))
);
CREATE UNIQUE INDEX IF NOT EXISTS creator_reward_events_sig_asset ON creator_reward_events (source_transaction_signature, asset_mint) WHERE source_transaction_signature IS NOT NULL;

CREATE TABLE IF NOT EXISTS creator_reward_allocations (
  id                                   bigserial PRIMARY KEY,
  creator_reward_event_id              bigint NOT NULL UNIQUE REFERENCES creator_reward_events(id),
  community_fund_bps                   integer NOT NULL CHECK (community_fund_bps BETWEEN 0 AND 10000),
  operator_retained_bps                integer NOT NULL CHECK (operator_retained_bps BETWEEN 0 AND 10000),
  community_fund_amount_base_units     numeric(39,0) NOT NULL CHECK (community_fund_amount_base_units >= 0),
  operator_retained_amount_base_units  numeric(39,0) NOT NULL CHECK (operator_retained_amount_base_units >= 0),
  asset_mint                           text NOT NULL,
  operator_creator_reward_wallet       text NOT NULL,
  community_treasury_wallet            text NOT NULL,
  allocation_status                    text NOT NULL DEFAULT 'calculated' CHECK (allocation_status IN ('calculated','awaiting_multisig_transfer','transferred','verified','failed','reversed')),
  community_transfer_signature         text UNIQUE,
  transfer_verified_at                 timestamptz,
  error_message                        text,
  created_at                           timestamptz NOT NULL DEFAULT now(),
  updated_at                           timestamptz NOT NULL DEFAULT now(),
  CHECK (community_fund_bps + operator_retained_bps = 10000),
  CHECK (allocation_status <> 'verified' OR (community_transfer_signature IS NOT NULL AND transfer_verified_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS community_fund_ledger (
  id                           bigserial PRIMARY KEY,
  source_type                  text NOT NULL DEFAULT 'creator_reward_allocation' CHECK (source_type IN ('creator_reward_allocation')),
  source_allocation_id         bigint NOT NULL UNIQUE REFERENCES creator_reward_allocations(id),
  asset_mint                   text NOT NULL,
  allocated_amount_base_units  numeric(39,0) NOT NULL CHECK (allocated_amount_base_units >= 0),
  treasury_wallet              text NOT NULL,
  transaction_signature        text UNIQUE,
  transfer_verified            boolean NOT NULL DEFAULT false,
  verification_slot            bigint,
  status                       text NOT NULL DEFAULT 'accrued' CHECK (status IN ('accrued','transfer_proposed','transferred','verified','failed','reversed')),
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now(),
  CHECK (status <> 'verified' OR (transfer_verified AND transaction_signature IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS community_reward_programs (
  id                 bigserial PRIMARY KEY,
  name               text NOT NULL,
  description        text NOT NULL,
  purpose            text NOT NULL CHECK (purpose IN ('onboarding','education','gameplay_contest','creator_support','event','bug_bounty','board_incentive','other')),
  eligibility_rules  text NOT NULL,
  fraud_controls     text NOT NULL,
  asset_mint         text NOT NULL,
  budget_base_units  numeric(39,0) NOT NULL CHECK (budget_base_units > 0),
  status             text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','proposed','approved','active','paused','completed','cancelled')),
  starts_at          timestamptz NOT NULL,
  ends_at            timestamptz NOT NULL,
  policy_version     text NOT NULL,
  created_by         text NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS community_reward_grants (
  id                            bigserial PRIMARY KEY,
  program_id                    bigint NOT NULL REFERENCES community_reward_programs(id),
  recipient_wallet              text NOT NULL,
  award_amount_base_units       numeric(39,0) NOT NULL CHECK (award_amount_base_units > 0),
  asset_mint                    text NOT NULL,
  eligibility_proof_reference   text NOT NULL CHECK (length(eligibility_proof_reference) >= 5),
  status                        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','payment_proposed','paid','rejected','reversed')),
  payment_transaction_signature text UNIQUE,
  payment_verified_at           timestamptz,
  decided_by                    text,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, recipient_wallet, eligibility_proof_reference),
  CHECK (status <> 'paid' OR (payment_transaction_signature IS NOT NULL AND payment_verified_at IS NOT NULL))
);

-- Versioned public policy / disclosure text.
CREATE TABLE IF NOT EXISTS policy_versions (
  key         text NOT NULL,
  version     text NOT NULL,
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (key, version)
);
INSERT INTO policy_versions (key, version, body) VALUES
  ('client_launch_disclosure', '2026-10-04.1', 'Coin launches are paid directly from your connected Solana wallet through the selected launchpad. TEK CITY does not custody or take a percentage of your launch payment. Network and launchpad fees apply as displayed before transaction approval.'),
  ('community_fund_disclosure', '2026-10-04.1', 'TEK CITY allocates 20% of verified creator rewards it actually receives from eligible TEK CITY-operated coins to the Community Fund. Community Fund assets may support announced game and community programs. Token ownership does not provide equity, dividends, revenue share, profit rights, ownership of Community Fund assets, or guaranteed financial returns.'),
  ('community_fund_model', '2026-10-04.1', 'TEK CITY allocates 20% of verified creator rewards it receives from eligible TEK CITY-operated coins to the Community Fund. Clients pay their own coin-launch costs and are not charged a percentage of launch payments by TEK CITY.'),
  ('token_utility_disclosure', '2026-10-04.1', 'TEK CITY tokens provide game utility only. They do not provide equity, dividends, revenue share, profit rights, ownership of Community Fund assets, or guaranteed financial returns.')
ON CONFLICT DO NOTHING;

-- Amounts and sources are immutable once written; rows are never deleted. Status columns may advance.
CREATE OR REPLACE FUNCTION tc_cr_events_freeze() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NEW.reward_amount_base_units <> OLD.reward_amount_base_units OR NEW.asset_mint <> OLD.asset_mint OR NEW.source_event_id <> OLD.source_event_id
     OR NEW.reward_recipient_wallet <> OLD.reward_recipient_wallet OR NEW.source_transaction_signature IS DISTINCT FROM OLD.source_transaction_signature THEN
    RAISE EXCEPTION 'creator_reward_events amounts are immutable'; END IF;
  NEW.updated_at := now(); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION tc_cr_alloc_freeze() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NEW.community_fund_amount_base_units <> OLD.community_fund_amount_base_units OR NEW.operator_retained_amount_base_units <> OLD.operator_retained_amount_base_units
     OR NEW.creator_reward_event_id <> OLD.creator_reward_event_id OR NEW.community_fund_bps <> OLD.community_fund_bps OR NEW.asset_mint <> OLD.asset_mint THEN
    RAISE EXCEPTION 'creator_reward_allocations amounts are immutable'; END IF;
  NEW.updated_at := now(); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION tc_cf_ledger_freeze() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NEW.allocated_amount_base_units <> OLD.allocated_amount_base_units OR NEW.source_allocation_id <> OLD.source_allocation_id OR NEW.asset_mint <> OLD.asset_mint THEN
    RAISE EXCEPTION 'community_fund_ledger amounts are immutable'; END IF;
  NEW.updated_at := now(); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION tc_grants_freeze() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
  IF NEW.award_amount_base_units <> OLD.award_amount_base_units OR NEW.recipient_wallet <> OLD.recipient_wallet OR NEW.program_id <> OLD.program_id THEN
    RAISE EXCEPTION 'community_reward_grants amounts are immutable'; END IF;
  NEW.updated_at := now(); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION tc_touch() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at := now(); RETURN NEW; END $$;
CREATE OR REPLACE FUNCTION tc_no_delete() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION '% is append-only', TG_TABLE_NAME; END $$;

DROP TRIGGER IF EXISTS creator_reward_events_freeze ON creator_reward_events;
CREATE TRIGGER creator_reward_events_freeze BEFORE UPDATE ON creator_reward_events FOR EACH ROW EXECUTE FUNCTION tc_cr_events_freeze();
DROP TRIGGER IF EXISTS creator_reward_allocations_freeze ON creator_reward_allocations;
CREATE TRIGGER creator_reward_allocations_freeze BEFORE UPDATE ON creator_reward_allocations FOR EACH ROW EXECUTE FUNCTION tc_cr_alloc_freeze();
DROP TRIGGER IF EXISTS community_fund_ledger_freeze ON community_fund_ledger;
CREATE TRIGGER community_fund_ledger_freeze BEFORE UPDATE ON community_fund_ledger FOR EACH ROW EXECUTE FUNCTION tc_cf_ledger_freeze();
DROP TRIGGER IF EXISTS community_reward_grants_freeze ON community_reward_grants;
CREATE TRIGGER community_reward_grants_freeze BEFORE UPDATE ON community_reward_grants FOR EACH ROW EXECUTE FUNCTION tc_grants_freeze();
DROP TRIGGER IF EXISTS operator_coins_touch ON operator_coins;
CREATE TRIGGER operator_coins_touch BEFORE UPDATE ON operator_coins FOR EACH ROW EXECUTE FUNCTION tc_touch();
DROP TRIGGER IF EXISTS community_reward_programs_touch ON community_reward_programs;
CREATE TRIGGER community_reward_programs_touch BEFORE UPDATE ON community_reward_programs FOR EACH ROW EXECUTE FUNCTION tc_touch();

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['operator_coins','creator_reward_events','creator_reward_allocations','community_fund_ledger','community_reward_programs','community_reward_grants','policy_versions'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I_nodelete ON %I', t, t);
    EXECUTE format('CREATE TRIGGER %I_nodelete BEFORE DELETE ON %I FOR EACH ROW EXECUTE FUNCTION tc_no_delete()', t, t);
  END LOOP;
END $$;

-- Admin roles (RBAC). Without rows here, an allowlisted admin has no Community Fund permissions.
CREATE TABLE IF NOT EXISTS admin_roles (
  address    text NOT NULL,
  role       text NOT NULL CHECK (role IN ('coin_approver','policy_admin','program_admin','grant_approver','ledger_reconciler')),
  source     text NOT NULL DEFAULT 'env',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (address, role)
);
