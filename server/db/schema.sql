-- TEK CITY schema v1. Idempotent: safe to run on every boot.

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  text NOT NULL CHECK (char_length(display_name) BETWEEN 2 AND 20),
  kind          text NOT NULL CHECK (kind IN ('guest', 'wallet')),
  avatar_seed   text NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  is_banned     boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now()
);

-- One row per wallet ever linked. address is normalized base58 and globally unique (one account per wallet).
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address       text NOT NULL UNIQUE CHECK (address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$'),
  chain         text NOT NULL DEFAULT 'solana',
  network       text NOT NULL DEFAULT 'devnet',
  linked_at     timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz,
  unlinked_at   timestamptz
);
CREATE INDEX IF NOT EXISTS wallet_accounts_user ON wallet_accounts(user_id);

CREATE TABLE IF NOT EXISTS wallet_login_nonces (
  nonce       text PRIMARY KEY,
  address     text NOT NULL,
  purpose     text NOT NULL CHECK (purpose IN ('login', 'reauth')),
  message     text NOT NULL,
  session_id  text,
  issued_at   timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  ip_hash     text
);
CREATE INDEX IF NOT EXISTS wallet_login_nonces_exp ON wallet_login_nonces(expires_at);

-- Session tokens are never stored: only an HMAC of the token.
CREATE TABLE IF NOT EXISTS sessions (
  id_hash        text PRIMARY KEY,
  user_id        uuid REFERENCES users(id) ON DELETE CASCADE,
  auth_method    text NOT NULL CHECK (auth_method IN ('anon', 'guest', 'wallet')),
  wallet_address text,
  csrf_token     text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL,
  reauth_at      timestamptz,
  revoked_at     timestamptz,
  ip_hash        text,
  ua_hash        text
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS city_state (
  id               int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  day              date NOT NULL,
  stability        int NOT NULL DEFAULT 70 CHECK (stability BETWEEN 0 AND 100),
  moods            jsonb NOT NULL DEFAULT '{"makers":50,"merchants":50,"residents":50}',
  boosts           jsonb NOT NULL DEFAULT '{}',
  day_status       text NOT NULL DEFAULT 'active',
  recovery_until   bigint,
  paused           boolean NOT NULL DEFAULT false,
  paused_reason    text,
  version          bigint NOT NULL DEFAULT 0,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS game_rounds (
  id            bigserial PRIMARY KEY,
  round_key     text NOT NULL UNIQUE,
  day           date NOT NULL,
  round_number  int NOT NULL CHECK (round_number BETWEEN 1 AND 96),
  starts_at     timestamptz NOT NULL,
  ends_at       timestamptz NOT NULL,
  status        text NOT NULL CHECK (status IN ('open', 'settling', 'settled')),
  settled_at    timestamptz,
  settlement    jsonb
);
-- At most one open round at any time.
CREATE UNIQUE INDEX IF NOT EXISTS game_rounds_one_open ON game_rounds((status)) WHERE status = 'open';

CREATE TABLE IF NOT EXISTS player_resources (
  user_id            uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  energy             int NOT NULL DEFAULT 8 CHECK (energy >= 0),
  build_credits      int NOT NULL DEFAULT 100 CHECK (build_credits >= 0),
  influence          int NOT NULL DEFAULT 0 CHECK (influence >= 0),
  influence_today    int NOT NULL DEFAULT 0 CHECK (influence_today >= 0),
  influence_day      date,
  position           int NOT NULL DEFAULT 0 CHECK (position BETWEEN 0 AND 23),
  last_checkin_round bigint,
  last_move_round    bigint,
  last_vote_round    bigint,
  contrib_round      bigint,
  contrib_count      int NOT NULL DEFAULT 0,
  visited_round      bigint,
  tutorial_done      boolean NOT NULL DEFAULT false,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_actions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  round_id         bigint REFERENCES game_rounds(id),
  action_type      text NOT NULL,
  idempotency_key  text NOT NULL,
  payload          jsonb NOT NULL DEFAULT '{}',
  result           jsonb,
  status           text NOT NULL DEFAULT 'ok',
  created_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS player_actions_round ON player_actions(round_id);

CREATE TABLE IF NOT EXISTS districts (
  id           int PRIMARY KEY,
  slug         text NOT NULL UNIQUE,
  name         text NOT NULL,
  neighborhood text NOT NULL,
  level        int NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  xp           int NOT NULL DEFAULT 0 CHECK (xp >= 0),
  xp_total     int NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS district_contributions (
  id          bigserial PRIMARY KEY,
  district_id int NOT NULL REFERENCES districts(id),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  round_id    bigint NOT NULL REFERENCES game_rounds(id),
  action_id   uuid REFERENCES player_actions(id),
  amount      int NOT NULL CHECK (amount > 0),
  xp          int NOT NULL CHECK (xp >= 0),
  level_at    int NOT NULL,
  day         date NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS district_contributions_d ON district_contributions(district_id, day, level_at);

CREATE TABLE IF NOT EXISTS district_upgrades (
  id          bigserial PRIMARY KEY,
  district_id int NOT NULL REFERENCES districts(id),
  from_level  int NOT NULL,
  to_level    int NOT NULL,
  round_id    bigint NOT NULL REFERENCES game_rounds(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_vault (
  id          int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  progress    int NOT NULL DEFAULT 0 CHECK (progress >= 0),
  milestone   int NOT NULL DEFAULT 0,
  lifetime    bigint NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS city_events (
  id          bigserial PRIMARY KEY,
  round_id    bigint REFERENCES game_rounds(id),
  kind        text NOT NULL CHECK (kind IN ('brief', 'crisis', 'unlock', 'admin', 'day')),
  code        text NOT NULL,
  title       text NOT NULL,
  body        text NOT NULL,
  options     jsonb NOT NULL DEFAULT '[]',
  target      int,
  requirement int,
  outcome     jsonb,
  status      text NOT NULL DEFAULT 'active',
  created_by  text NOT NULL DEFAULT 'system',
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS city_events_round ON city_events(round_id);

CREATE TABLE IF NOT EXISTS event_votes (
  event_id   bigint NOT NULL REFERENCES city_events(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_idx int NOT NULL CHECK (option_idx BETWEEN 0 AND 3),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id        bigserial PRIMARY KEY,
  round_id  bigint REFERENCES game_rounds(id),
  scope     text NOT NULL DEFAULT 'today',
  entries   jsonb NOT NULL,
  taken_at  timestamptz NOT NULL DEFAULT now()
);

-- Append-only ledgers (UPDATE/DELETE blocked by trigger).
CREATE TABLE IF NOT EXISTS resource_ledger (
  id            bigserial PRIMARY KEY,
  user_id       uuid NOT NULL,
  round_id      bigint,
  resource      text NOT NULL CHECK (resource IN ('energy', 'build_credits', 'influence')),
  delta         int NOT NULL,
  balance_after int NOT NULL,
  reason        text NOT NULL,
  action_id     uuid,
  at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS resource_ledger_user ON resource_ledger(user_id, at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id            bigserial PRIMARY KEY,
  at            timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid,
  actor_wallet  text,
  action        text NOT NULL,
  target        text,
  details       jsonb NOT NULL DEFAULT '{}',
  ip_hash       text
);
CREATE INDEX IF NOT EXISTS audit_logs_action ON audit_logs(action, at);

CREATE TABLE IF NOT EXISTS city_activity (
  id    bigserial PRIMARY KEY,
  at    timestamptz NOT NULL DEFAULT now(),
  kind  text NOT NULL,
  text  text NOT NULL
);

CREATE OR REPLACE FUNCTION tekcity_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'append-only table: % is not allowed on %', TG_OP, TG_TABLE_NAME;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS audit_logs_append_only ON audit_logs;
CREATE TRIGGER audit_logs_append_only BEFORE UPDATE OR DELETE ON audit_logs FOR EACH ROW EXECUTE FUNCTION tekcity_append_only();
DROP TRIGGER IF EXISTS resource_ledger_append_only ON resource_ledger;
CREATE TRIGGER resource_ledger_append_only BEFORE UPDATE OR DELETE ON resource_ledger FOR EACH ROW EXECUTE FUNCTION tekcity_append_only();

CREATE TABLE IF NOT EXISTS feature_flags (
  key         text PRIMARY KEY,
  enabled     boolean NOT NULL,
  locked      boolean NOT NULL DEFAULT false,
  description text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  text
);

CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);

CREATE TABLE IF NOT EXISTS admin_wallets (
  address  text PRIMARY KEY,
  source   text NOT NULL DEFAULT 'env',
  added_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS abuse_flags (
  id          bigserial PRIMARY KEY,
  user_id     uuid,
  wallet      text,
  ip_hash     text,
  reason      text NOT NULL,
  details     jsonb NOT NULL DEFAULT '{}',
  status      text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
  reviewed_by text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limit_events (
  id       bigserial PRIMARY KEY,
  bucket   text NOT NULL,
  key_hash text NOT NULL,
  at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limit_events_key ON rate_limit_events(key_hash, at);

CREATE TABLE IF NOT EXISTS cosmetics (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL,
  kind        text NOT NULL DEFAULT 'badge',
  enabled     boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  cosmetic_id text NOT NULL REFERENCES cosmetics(id),
  earned_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, cosmetic_id)
);

CREATE TABLE IF NOT EXISTS support_reports (
  id         bigserial PRIMARY KEY,
  kind       text NOT NULL CHECK (kind IN ('contact', 'scam')),
  email      text,
  subject    text NOT NULL,
  body       text NOT NULL,
  url        text,
  status     text NOT NULL DEFAULT 'new',
  ip_hash    text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ===== Launchpad: one Pump.fun coin per board space =====
CREATE TABLE IF NOT EXISTS space_coins (
  stop_id          int PRIMARY KEY CHECK (stop_id BETWEEN 0 AND 23),
  mint             text NOT NULL UNIQUE,
  name             text NOT NULL,
  symbol           text NOT NULL,
  image_url        text,
  metadata_uri     text,
  launcher_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  launcher_wallet  text NOT NULL,
  launch_sig       text NOT NULL,
  split_done       boolean NOT NULL DEFAULT false,
  split_sig        text,
  grown_lamports   bigint NOT NULL DEFAULT 0,
  grow_count       int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS coin_intents (
  id          text PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet      text NOT NULL,
  kind        text NOT NULL CHECK (kind IN ('launch','grow','split')),
  stop_id     int NOT NULL,
  mint        text NOT NULL,
  lamports    bigint NOT NULL DEFAULT 0,
  meta        jsonb NOT NULL DEFAULT '{}',
  tx_b64      text NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coin_intents_user ON coin_intents(user_id, created_at);
CREATE TABLE IF NOT EXISTS coin_txs (
  signature   text PRIMARY KEY,
  kind        text NOT NULL CHECK (kind IN ('launch','grow','split')),
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  wallet      text NOT NULL,
  stop_id     int NOT NULL,
  mint        text NOT NULL,
  lamports    bigint NOT NULL DEFAULT 0,
  round_id    bigint,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coin_txs_round ON coin_txs(round_id, stop_id);
ALTER TABLE player_resources ADD COLUMN IF NOT EXISTS spins_day date;
ALTER TABLE player_resources ADD COLUMN IF NOT EXISTS spins_used int NOT NULL DEFAULT 0;
ALTER TABLE space_coins ADD COLUMN IF NOT EXISTS image_bytes bytea;
ALTER TABLE space_coins ADD COLUMN IF NOT EXISTS image_mime text;
ALTER TABLE coin_intents ADD COLUMN IF NOT EXISTS image_bytes bytea;
ALTER TABLE player_resources ADD COLUMN IF NOT EXISTS spins_peak numeric NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS reward_runs (
  id                    bigserial PRIMARY KEY,
  hour_key              text NOT NULL UNIQUE,
  pool_lamports         bigint NOT NULL DEFAULT 0,
  distributed_lamports  bigint NOT NULL DEFAULT 0,
  holders               int NOT NULL DEFAULT 0,
  mode                  text NOT NULL CHECK (mode IN ('auto','manual')),
  status                text NOT NULL DEFAULT 'pending',
  note                  text,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reward_payouts (
  id          bigserial PRIMARY KEY,
  run_id      bigint NOT NULL REFERENCES reward_runs(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  wallet      text NOT NULL,
  tek_balance numeric NOT NULL,
  share_bps   int NOT NULL,
  lamports    bigint NOT NULL,
  signature   text,
  status      text NOT NULL DEFAULT 'pending'
);
CREATE INDEX IF NOT EXISTS reward_payouts_run ON reward_payouts(run_id);
ALTER TABLE space_coins ADD COLUMN IF NOT EXISTS top_buy_lamports bigint NOT NULL DEFAULT 0;
ALTER TABLE space_coins ADD COLUMN IF NOT EXISTS launch_lamports bigint NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS space_coin_history (
  id          bigserial PRIMARY KEY,
  stop_id     int NOT NULL,
  mint        text NOT NULL,
  symbol      text NOT NULL,
  launcher_wallet text NOT NULL,
  grown_lamports bigint NOT NULL,
  replaced_by text,
  ended_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS jackpots (
  id          bigserial PRIMARY KEY,
  user_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  wallet      text NOT NULL,
  lamports    bigint NOT NULL,
  signature   text,
  status      text NOT NULL DEFAULT 'pending',
  round_id    bigint,
  created_at  timestamptz NOT NULL DEFAULT now()
);
