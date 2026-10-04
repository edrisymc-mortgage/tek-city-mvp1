-- 002: multi-wallet Solana support, durable purchase / launch settlement, idempotency records.
-- Only public addresses and transaction signatures are stored. Never private keys or seed phrases.

-- Wallet identities (one row per wallet address that proved ownership with a signed nonce).
ALTER TABLE wallet_accounts ADD COLUMN IF NOT EXISTS wallet_name text;          -- e.g. "Phantom", "Solflare"
ALTER TABLE wallet_accounts ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE wallet_accounts ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
CREATE OR REPLACE VIEW wallet_profiles AS
  SELECT id, user_id, address, chain, network, wallet_name, linked_at, last_login_at, unlinked_at, created_at, updated_at FROM wallet_accounts;
-- Wallet-authenticated sessions (token stored only as an HMAC in sessions.id_hash).
CREATE OR REPLACE VIEW wallet_sessions AS
  SELECT id_hash, user_id, wallet_address, created_at, last_seen_at, expires_at, revoked_at FROM sessions WHERE auth_method = 'wallet';
-- wallet_login_nonces already exists (server-issued, single-use, 5-minute expiry). Add an audit column.
ALTER TABLE wallet_login_nonces ADD COLUMN IF NOT EXISTS error_message text;

-- One row per wallet-signed transaction we submit. The signature is the primary key, so a transaction
-- can be settled at most once no matter how many times it is submitted or re-checked.
CREATE TABLE IF NOT EXISTS chain_tx_processing (
  signature     text PRIMARY KEY CHECK (signature ~ '^[1-9A-HJ-NP-Za-km-z]{64,90}$'),
  intent_id     text NOT NULL UNIQUE,
  kind          text NOT NULL CHECK (kind IN ('launch','grow','split')),
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  wallet        text NOT NULL,
  mint          text NOT NULL,
  stop_id       int,
  lamports      bigint NOT NULL DEFAULT 0,
  blockhash     text,
  network       text NOT NULL DEFAULT 'mainnet-beta',
  status        text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','confirmed','settled','failed','expired','timeout')),
  error_message text,
  attempts      int NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz
);
CREATE INDEX IF NOT EXISTS chain_tx_processing_status ON chain_tx_processing(status, created_at);

-- Coin buys ("Buy with SOL"). Only written after the chain confirms the transaction.
CREATE TABLE IF NOT EXISTS purchases (
  id            bigserial PRIMARY KEY,
  signature     text NOT NULL UNIQUE REFERENCES chain_tx_processing(signature),
  user_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  wallet        text NOT NULL,
  mint          text NOT NULL,
  stop_id       int,
  symbol        text,
  lamports      bigint NOT NULL CHECK (lamports > 0),
  spent_lamports bigint,
  tokens        numeric,
  status        text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed','failed')),
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS purchases_wallet ON purchases(wallet, created_at);

-- Coin launches, from preparation through confirmation.
CREATE TABLE IF NOT EXISTS coin_launches (
  id                 bigserial PRIMARY KEY,
  intent_id          text NOT NULL UNIQUE,
  signature          text UNIQUE,
  user_id            uuid REFERENCES users(id) ON DELETE SET NULL,
  creator_wallet     text NOT NULL,
  mint               text NOT NULL,
  name               text NOT NULL,
  symbol             text NOT NULL,
  description        text,
  metadata_uri       text,
  image_url          text,
  stop_id            int,
  first_buy_lamports bigint NOT NULL DEFAULT 0,
  status             text NOT NULL DEFAULT 'prepared' CHECK (status IN ('prepared','submitted','confirmed','placed','not_placed','failed','expired','timeout')),
  error_message      text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  processed_at       timestamptz
);
CREATE INDEX IF NOT EXISTS coin_launches_creator ON coin_launches(creator_wallet, created_at);
