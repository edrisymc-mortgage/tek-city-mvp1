-- One-time board reset before the TEK CITY token launch (requested 2026-10-04). Applied once, like every migration.
-- Clears every coin on the board, all buy-in totals, positions, spins, milestones and activity so the board starts
-- from zero. Keeps: player accounts and linked wallets, sessions, audit logs, settings, and the on-chain
-- signature registry (chain_tx_processing), so an old transaction can never be credited again.
-- Community Fund tables are append-only and untouched (they were empty).
TRUNCATE TABLE
  space_coins, space_coin_history, coin_intents, coin_txs, coin_launches, purchases,
  reward_payouts, reward_runs, jackpots, tek_buys, tek_scan, milestones,
  city_activity, player_actions, resource_ledger, leaderboard_snapshots, player_resources
RESTART IDENTITY CASCADE;
