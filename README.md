# TEK CITY — Live Board (demo)

Server-authoritative, real-time multiplayer city board game. Virtual credits only — no wallets, tokens, or real money.

## How it plays
- 36-space board: 20 districts in 8 sectors, 4 Community Vault spaces, 4 City Event spaces, 4 Maglev stations, and 4 corners (The Gate, Power Grid, Nexus, Launch Pad).
- 24-hour city clock: 96 rounds of 15 minutes. Each player gets one roll per round. A round ends when the timer runs out or every online player has finished.
- The server rolls the dice, moves tokens, and applies every landing effect.
- **Districts:** found an open district, then anyone can co-invest to upgrade it (5 levels). Tolls are split between shareholders by stake; 10% of every toll goes to the Community Vault.
- **The Gate:** +200 every time you pass it.
- **Community Vault:** shared pot funded by fares, fees, and tolls. Vault cards and the Nexus pay out from it.
- **Power Grid:** collect 10 per build level you hold shares in. **Launch Pad:** pay 50 to fly anywhere.
- Live feed, player rankings by net worth, refresh-safe sessions (each browser tab is its own player).

## Run locally
```bash
npm install
npm start            # http://localhost:3000
ROUND_SECONDS=60 npm start   # fast rounds for testing
npm test             # automated smoke test (2 bots, 40 rounds)
```

## Deploy (Render)
Build `npm install`, start `npm start`. Optional env var `ROUND_SECONDS` (default 900).
