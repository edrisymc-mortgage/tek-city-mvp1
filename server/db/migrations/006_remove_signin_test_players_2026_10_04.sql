-- Removes the throwaway players created on 2026-10-04 22:25-22:45 UTC while testing wallet sign-in on the live
-- site (test wallets only; no coins, launches or buys). Keeps the board at zero players before the token launch.
DELETE FROM users u
 WHERE u.created_at BETWEEN '2026-10-04 22:25:00+00' AND '2026-10-04 22:45:00+00'
   AND NOT EXISTS (SELECT 1 FROM coin_launches l WHERE l.user_id = u.id)
   AND NOT EXISTS (SELECT 1 FROM purchases p WHERE p.user_id = u.id);
