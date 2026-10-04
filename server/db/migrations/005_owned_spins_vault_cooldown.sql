-- Spins from TEK CITY owned (per round), a one-time starter spin, and a 12-hour Vault jackpot cooldown.
ALTER TABLE player_resources ADD COLUMN IF NOT EXISTS round_spins_used  int NOT NULL DEFAULT 0;
ALTER TABLE player_resources ADD COLUMN IF NOT EXISTS round_spins_round bigint;
ALTER TABLE player_resources ADD COLUMN IF NOT EXISTS starter_used      int NOT NULL DEFAULT 0;
CREATE TABLE IF NOT EXISTS vault_hits (
  id         bigserial PRIMARY KEY,
  user_id    uuid,
  round_id   bigint,
  spins      int NOT NULL,
  hit_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vault_hits_at ON vault_hits (hit_at DESC);
