// TEK CITY - server-authoritative live board game (demo, virtual credits only)
const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3000;
const ROUND_SECONDS = Number(process.env.ROUND_SECONDS || 900); // 15 minutes per round
const ROUNDS_PER_DAY = 96; // 24 hours x 4 rounds
const START_CREDITS = 1500;
const GATE_REWARD = 200;
const MAX_PLAYERS = 8;
const DATA_FILE = path.join(__dirname, "data", "state.json");

// ---------------------------------------------------------------- board
const SECTORS = [
  { id: "neon", name: "Neon Ward", color: "#ff3fd8" },
  { id: "foundry", name: "Foundry Row", color: "#ff9f1c" },
  { id: "cloud", name: "Cloudline", color: "#41d9ff" },
  { id: "metro", name: "Old Metro", color: "#9cff57" },
  { id: "harbor", name: "Harbor Grid", color: "#8b6bff" },
  { id: "civic", name: "Civic Core", color: "#ffd166" },
  { id: "quantum", name: "Quantum Heights", color: "#ff5a6e" },
  { id: "aurora", name: "Aurora Bay", color: "#2ff3c0" },
];

const DISTRICT_NAMES = [
  "Pulse Market", "Synth Alley", "Rivet Yard", "Smelter Square", "Ironworks",
  "Data Spire", "Sky Dock", "Arc Plaza", "Old Line Depot", "Tunnel Bazaar",
  "Cargo Pier", "Drone Wharf", "Signal Exchange", "Council Hall", "Mint Tower",
  "Quark Labs", "Fusion Row", "Photon Park", "Tidewall", "Crown Terrace",
];

// pattern per side (8 spaces between corners)
const SIDE_PATTERN = ["district", "district", "vault", "district", "transit", "district", "event", "district"];
// sector assignment for the 5 districts of each side: first 2 -> sector A, last 3 -> sector B
const CORNERS = {
  0: { type: "gate", name: "The Gate", text: `Start. Collect ${GATE_REWARD} credits every time you pass or land.` },
  9: { type: "grid", name: "Power Grid", text: "Collect 10 credits for every build level you hold shares in." },
  18: { type: "nexus", name: "Nexus", text: "Free zone. Collect 25% of the Community Vault." },
  27: { type: "launch", name: "Launch Pad", text: "Pay 50 to launch to any space on the board." },
};
const TRANSIT_NAMES = ["Maglev South", "Maglev West", "Maglev North", "Maglev East"];

function buildBoard() {
  const spaces = [];
  let d = 0;
  let transit = 0;
  for (let i = 0; i < 36; i++) {
    if (CORNERS[i]) { spaces.push({ id: i, ...CORNERS[i] }); continue; }
    const side = Math.floor(i / 9); // 0..3
    const offset = (i % 9) - 1; // 0..7
    const kind = SIDE_PATTERN[offset];
    if (kind === "district") {
      const nth = [0, 1, 3, 5, 7].indexOf(offset); // 0..4 within side
      const sector = SECTORS[side * 2 + (nth < 2 ? 0 : 1)];
      const cost = 100 + side * 50 + nth * 12;
      spaces.push({
        id: i, type: "district", name: DISTRICT_NAMES[d++], sector: sector.id,
        color: sector.color, sectorName: sector.name, cost,
        text: `Found for ${cost}. Anyone can co-invest to upgrade. Tolls are split by share.`,
      });
    } else if (kind === "vault") {
      spaces.push({ id: i, type: "vault", name: "Community Vault", text: "Draw a Vault card. The Vault is shared by the whole city." });
    } else if (kind === "transit") {
      spaces.push({ id: i, type: "transit", name: TRANSIT_NAMES[transit++], text: "Pay a 25 fare to the Vault and ride to the next Maglev station." });
    } else {
      spaces.push({ id: i, type: "event", name: "City Event", text: "Draw a City Event. Anything can happen." });
    }
  }
  return spaces;
}
const BOARD = buildBoard();
const TOLL_MULT = [1, 2.5, 5, 8, 12]; // level 0 (founded) .. 4 (max)
const MAX_LEVEL = 4;
const COLORS = ["#41d9ff", "#ff3fd8", "#ffd166", "#9cff57", "#ff9f1c", "#8b6bff", "#ff5a6e", "#2ff3c0"];
const TOKENS = ["◆", "▲", "●", "■", "★", "⬢", "✦", "⬣"];

// ---------------------------------------------------------------- state
function freshState() {
  return {
    day: 1,
    round: 1,
    roundEndsAt: Date.now() + ROUND_SECONDS * 1000,
    vault: 500,
    players: {},
    order: [],
    districts: {}, // spaceId -> { founder, level, shares: {pid: credits} }
    feed: [],
    lastMove: null,
    seq: 0,
    history: [],
  };
}

let state = freshState();
try {
  if (fs.existsSync(DATA_FILE)) {
    const loaded = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (loaded && loaded.players) state = { ...freshState(), ...loaded, roundEndsAt: Date.now() + ROUND_SECONDS * 1000 };
  }
} catch (e) { console.error("Could not load saved state:", e.message); }

let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify(state));
    } catch (e) { console.error("Save failed:", e.message); }
  }, 300);
}

const sockets = new Map(); // socket.id -> playerId
function onlineIds() { return new Set(sockets.values()); }

function log(text, kind = "info") {
  state.feed.unshift({ t: Date.now(), text, kind, round: state.round, day: state.day });
  state.feed = state.feed.slice(0, 60);
}
function clock(round) {
  const mins = (round - 1) * 15;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
}
const rnd = (n) => crypto.randomInt(n);
const P = (id) => state.players[id];

function netWorth(pid) {
  let invested = 0;
  for (const d of Object.values(state.districts)) invested += d.shares[pid] || 0;
  return P(pid).credits + invested;
}
function totalInvested(d) { return Object.values(d.shares).reduce((a, b) => a + b, 0); }
function toll(spaceId) {
  const d = state.districts[spaceId];
  return Math.round((BOARD[spaceId].cost / 8) * TOLL_MULT[d.level]);
}
function upgradeCost(spaceId) {
  const d = state.districts[spaceId];
  return Math.round(BOARD[spaceId].cost * (0.6 + d.level * 0.3));
}

// pay credits from player to the vault, vault bails out shortfall is not allowed -> credits floor at 0
function charge(pid, amount, toVault = true) {
  const p = P(pid);
  const paid = Math.min(p.credits, amount);
  p.credits -= paid;
  if (toVault) state.vault += paid;
  return paid;
}
function gain(pid, amount) { P(pid).credits += amount; }
function fromVault(pid, amount) {
  const amt = Math.min(state.vault, Math.max(0, Math.round(amount)));
  state.vault -= amt;
  gain(pid, amt);
  return amt;
}

// ---------------------------------------------------------------- cards
const VAULT_CARDS = [
  { text: "Co-op Dividend: receive 10% of the Vault.", run: (pid) => `received ${fromVault(pid, state.vault * 0.1)} from the Vault` },
  { text: "Neighborhood Fund: contribute 60 to the Vault.", run: (pid) => `contributed ${charge(pid, 60)} to the Vault` },
  { text: "Builder Grant: receive 100 from the Vault.", run: (pid) => `received ${fromVault(pid, 100)} builder grant` },
  { text: "Shared Wealth: every player receives 25 from the Vault.", run: () => { let t = 0; for (const id of state.order) t += fromVault(id, 25); return `shared ${t} with the whole city`; } },
  { text: "Civic Duty: pay 10 per build level you hold shares in.", run: (pid) => `paid ${charge(pid, 10 * heldLevels(pid))} in civic duty` },
  { text: "Lucky Ledger: receive 50 credits.", run: (pid) => { gain(pid, 50); return "found 50 credits in the ledger"; } },
];
const EVENT_CARDS = [
  { text: "Tech Boom: every player gains 50 credits.", run: () => { state.order.forEach((id) => gain(id, 50)); return "triggered a citywide tech boom (+50 everyone)"; } },
  { text: "Blackout: move directly to the Power Grid.", run: (pid, ctx) => { moveTo(pid, 9, ctx); return "was pulled to the Power Grid by a blackout"; } },
  { text: "Drone Express: advance to The Gate.", run: (pid, ctx) => { moveTo(pid, 0, ctx); return "took the Drone Express to The Gate"; } },
  { text: "Road Work: move back 3 spaces.", run: (pid, ctx) => { moveTo(pid, (P(pid).pos + 33) % 36, ctx, true); return "hit road work and moved back 3"; } },
  { text: "Street Festival: district shareholders earn 20 per held build level.", run: () => { state.order.forEach((id) => gain(id, 20 * heldLevels(id))); return "started a street festival (shareholders paid)"; } },
  { text: "City Audit: pay 75 to the Vault.", run: (pid) => `paid ${charge(pid, 75)} in a city audit` },
  { text: "Hyperloop Pass: ride to the nearest Maglev station.", run: (pid, ctx) => { const t = nextOfType(P(pid).pos, "transit"); moveTo(pid, t, ctx); return `rode the hyperloop to ${BOARD[t].name}`; } },
  { text: "Venture Win: collect 120 credits.", run: (pid) => { gain(pid, 120); return "closed a venture deal (+120)"; } },
];
function heldLevels(pid) {
  let n = 0;
  for (const d of Object.values(state.districts)) if (d.shares[pid]) n += d.level + 1;
  return n;
}
function nextOfType(from, type) {
  for (let s = 1; s <= 36; s++) { const i = (from + s) % 36; if (BOARD[i].type === type) return i; }
  return from;
}

// ---------------------------------------------------------------- movement & landing
function moveTo(pid, target, ctx, backwards = false) {
  const p = P(pid);
  let pos = p.pos;
  let guard = 0;
  while (pos !== target && guard++ < 40) {
    pos = backwards ? (pos + 35) % 36 : (pos + 1) % 36;
    ctx.path.push(pos);
    if (!backwards && pos === 0) passGate(pid);
  }
  p.pos = target;
  ctx.redirect = true;
}
function passGate(pid) {
  gain(pid, GATE_REWARD);
  log(`${P(pid).name} passed The Gate and collected ${GATE_REWARD}.`, "gate");
}

function resolveLanding(pid, ctx, depth = 0) {
  const p = P(pid);
  const space = BOARD[p.pos];
  ctx.redirect = false;
  switch (space.type) {
    case "gate": break; // reward already given when passing
    case "district": {
      const d = state.districts[space.id];
      if (!d) {
        p.pending = { type: "found", space: space.id, cost: space.cost };
        log(`${p.name} landed on unclaimed ${space.name}.`);
      } else {
        const amount = toll(space.id);
        const total = totalInvested(d);
        const others = Object.entries(d.shares).filter(([id]) => id !== pid);
        const myShare = (d.shares[pid] || 0) / total;
        const due = Math.round(amount * (1 - myShare));
        if (due > 0) {
          const paid = charge(pid, due, false);
          const vaultCut = Math.round(paid * 0.1);
          state.vault += vaultCut;
          let rest = paid - vaultCut;
          const othersTotal = others.reduce((a, [, v]) => a + v, 0) || 1;
          others.forEach(([id, v], idx) => {
            const cut = idx === others.length - 1 ? rest : Math.round(((paid - vaultCut) * v) / othersTotal);
            rest -= cut;
            if (P(id)) gain(id, cut);
          });
          log(`${p.name} paid ${paid} toll at ${space.name} (10% to the Vault).`, "toll");
        } else {
          log(`${p.name} landed on their own ${space.name}. No toll.`);
        }
        if (d.level < MAX_LEVEL) p.pending = { type: "invest", space: space.id, cost: upgradeCost(space.id) };
      }
      break;
    }
    case "vault": {
      const card = VAULT_CARDS[rnd(VAULT_CARDS.length)];
      const what = card.run(pid, ctx);
      ctx.card = { deck: "Community Vault", text: card.text };
      log(`Vault card: ${p.name} ${what}.`, "vault");
      break;
    }
    case "event": {
      const card = EVENT_CARDS[rnd(EVENT_CARDS.length)];
      const what = card.run(pid, ctx);
      ctx.card = { deck: "City Event", text: card.text };
      log(`City Event: ${p.name} ${what}.`, "event");
      if (ctx.redirect && depth < 2) resolveLanding(pid, ctx, depth + 1);
      break;
    }
    case "transit": {
      const paid = charge(pid, 25);
      const next = nextOfType(p.pos, "transit");
      moveTo(pid, next, ctx);
      log(`${p.name} paid ${paid} fare and rode to ${BOARD[next].name}.`, "transit");
      break;
    }
    case "grid": {
      const amt = 10 * heldLevels(pid);
      gain(pid, amt);
      log(`${p.name} tapped the Power Grid for ${amt}.`, "grid");
      break;
    }
    case "nexus": {
      const amt = fromVault(pid, state.vault * 0.25);
      log(`${p.name} reached the Nexus and collected ${amt} from the Vault.`, "vault");
      break;
    }
    case "launch": {
      p.pending = { type: "launch", space: space.id, cost: 50 };
      log(`${p.name} is on the Launch Pad.`);
      break;
    }
  }
}

function roll(pid) {
  const p = P(pid);
  if (!p) return "Join the game first.";
  if (p.rolledRound === key()) return "You already rolled this round. Wait for the next round.";
  if (p.pending) return "Resolve your current action first.";
  const d1 = rnd(6) + 1;
  const d2 = rnd(6) + 1;
  const steps = d1 + d2;
  const ctx = { path: [], card: null };
  let pos = p.pos;
  for (let s = 0; s < steps; s++) {
    pos = (pos + 1) % 36;
    ctx.path.push(pos);
    if (pos === 0) passGate(pid);
  }
  p.pos = pos;
  p.rolledRound = key();
  p.lastRoll = [d1, d2];
  log(`${p.name} rolled ${d1} + ${d2} = ${steps} and moved to ${BOARD[pos].name}.`, "roll");
  if (d1 === d2) { gain(pid, 25); log(`Doubles! ${p.name} earned a 25 credit streak bonus.`, "gate"); }
  resolveLanding(pid, ctx);
  state.lastMove = { seq: ++state.seq, pid, from: ctx.path.length ? null : pos, path: ctx.path, dice: [d1, d2], card: ctx.card };
  maybeAdvance();
  return null;
}

function resolve(pid, accept, target) {
  const p = P(pid);
  if (!p || !p.pending) return "Nothing to resolve.";
  const pend = p.pending;
  p.pending = null;
  if (!accept) { log(`${p.name} passed on ${pend.type === "launch" ? "the launch" : BOARD[pend.space].name}.`); maybeAdvance(); return null; }
  if (p.credits < pend.cost) { p.pending = pend; return `Not enough credits (need ${pend.cost}).`; }
  const space = BOARD[pend.space];
  if (pend.type === "found") {
    if (state.districts[space.id]) return "Already founded.";
    p.credits -= pend.cost;
    state.districts[space.id] = { founder: pid, level: 0, shares: { [pid]: pend.cost } };
    log(`${p.name} founded ${space.name} in ${space.sectorName}.`, "build");
  } else if (pend.type === "invest") {
    const d = state.districts[space.id];
    if (!d || d.level >= MAX_LEVEL) return "Cannot upgrade.";
    p.credits -= pend.cost;
    d.level += 1;
    d.shares[pid] = (d.shares[pid] || 0) + pend.cost;
    log(`${p.name} co-invested ${pend.cost} to raise ${space.name} to level ${d.level + 1}.`, "build");
  } else if (pend.type === "launch") {
    const t = Number(target);
    if (!Number.isInteger(t) || t < 0 || t > 35 || t === 27) { p.pending = pend; return "Pick a valid destination."; }
    charge(pid, 50);
    const ctx = { path: [], card: null };
    moveTo(pid, t, ctx);
    log(`${p.name} launched to ${BOARD[t].name}.`, "transit");
    resolveLanding(pid, ctx);
    state.lastMove = { seq: ++state.seq, pid, path: ctx.path, dice: null, card: ctx.card };
  }
  maybeAdvance();
  return null;
}

const key = () => `${state.day}-${state.round}`;

function maybeAdvance() {
  const online = [...onlineIds()].filter((id) => P(id));
  if (online.length === 0) return;
  const done = online.every((id) => P(id).rolledRound === key() && !P(id).pending);
  if (done) advanceRound("All active players finished their turns.");
}

function advanceRound(reason) {
  for (const id of state.order) {
    const p = P(id);
    if (p.pending) { log(`${p.name}'s pending action expired.`); p.pending = null; }
  }
  if (state.round >= ROUNDS_PER_DAY) {
    const ranking = [...state.order].sort((a, b) => netWorth(b) - netWorth(a));
    if (ranking.length) log(`Day ${state.day} complete. ${P(ranking[0]).name} leads with a net worth of ${netWorth(ranking[0])}.`, "gate");
    state.history.unshift({ day: state.day, leader: ranking[0] ? P(ranking[0]).name : null });
    state.day += 1;
    state.round = 1;
  } else {
    state.round += 1;
  }
  state.roundEndsAt = Date.now() + ROUND_SECONDS * 1000;
  log(`Round ${state.round} of ${ROUNDS_PER_DAY} begins (${clock(state.round)}). ${reason}`, "round");
}

function publicState() {
  const online = onlineIds();
  return {
    day: state.day,
    round: state.round,
    roundsPerDay: ROUNDS_PER_DAY,
    clock: clock(state.round),
    roundEndsAt: state.roundEndsAt,
    roundSeconds: ROUND_SECONDS,
    serverNow: Date.now(),
    vault: state.vault,
    roundKey: key(),
    players: state.order.map((id) => {
      const p = P(id);
      return { id, name: p.name, color: p.color, token: p.token, pos: p.pos, credits: p.credits, netWorth: netWorth(id), online: online.has(id), rolled: p.rolledRound === key(), pending: p.pending, lastRoll: p.lastRoll };
    }),
    districts: Object.fromEntries(Object.entries(state.districts).map(([sid, d]) => [sid, { ...d, toll: toll(Number(sid)), upgradeCost: d.level < MAX_LEVEL ? upgradeCost(Number(sid)) : null }])),
    feed: state.feed.slice(0, 40),
    lastMove: state.lastMove,
  };
}

// ---------------------------------------------------------------- server
const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ ok: true, game: "TEK CITY", round: state.round, day: state.day, players: state.order.length }));
app.get("/api/board", (_req, res) => res.json({ board: BOARD, sectors: SECTORS }));
app.get("/api/state", (_req, res) => res.json(publicState()));

const server = http.createServer(app);
const io = new Server(server);

function broadcast() { io.emit("state", publicState()); save(); }

io.on("connection", (socket) => {
  socket.emit("board", { board: BOARD, sectors: SECTORS, rules: { gate: GATE_REWARD, start: START_CREDITS, roundsPerDay: ROUNDS_PER_DAY, roundSeconds: ROUND_SECONDS } });
  socket.emit("state", publicState());

  socket.on("hello", ({ playerId } = {}) => {
    if (playerId && P(playerId)) {
      sockets.set(socket.id, playerId);
      socket.emit("you", { playerId });
      broadcast();
    }
  });

  socket.on("join", ({ name } = {}, ack) => {
    const clean = String(name || "").replace(/[^\w .\-]/g, "").trim().slice(0, 16);
    if (!clean) return ack && ack({ error: "Enter a name." });
    if (state.order.length >= MAX_PLAYERS) return ack && ack({ error: "The city is full (8 players). Reset to start fresh." });
    const id = crypto.randomUUID();
    const n = state.order.length;
    state.players[id] = { id, name: clean, color: COLORS[n % COLORS.length], token: TOKENS[n % TOKENS.length], pos: 0, credits: START_CREDITS, rolledRound: null, pending: null, lastRoll: null };
    state.order.push(id);
    sockets.set(socket.id, id);
    log(`${clean} entered TEK CITY with ${START_CREDITS} credits.`, "join");
    ack && ack({ playerId: id });
    broadcast();
  });

  const guard = (fn) => (payload = {}, ack) => {
    const pid = sockets.get(socket.id);
    const err = fn(pid, payload);
    ack && ack({ error: err || null });
    if (!err) broadcast();
  };

  socket.on("roll", guard((pid) => roll(pid)));
  socket.on("resolve", guard((pid, { accept, target }) => resolve(pid, !!accept, target)));
  socket.on("leave", guard((pid) => {
    if (!pid || !P(pid)) return "Not in game.";
    const name = P(pid).name;
    for (const d of Object.values(state.districts)) delete d.shares[pid];
    for (const [sid, d] of Object.entries(state.districts)) if (!Object.keys(d.shares).length) delete state.districts[sid];
    delete state.players[pid];
    state.order = state.order.filter((x) => x !== pid);
    for (const [sid, v] of sockets) if (v === pid) sockets.delete(sid);
    log(`${name} left the city.`, "join");
    return null;
  }));
  socket.on("reset", guard(() => {
    state = freshState();
    sockets.clear();
    log("A new city charter was signed. The board has been reset.", "round");
    io.emit("you", { playerId: null });
    return null;
  }));
  socket.on("skipRound", guard(() => { advanceRound("Round skipped from the control desk."); return null; }));

  socket.on("disconnect", () => {
    sockets.delete(socket.id);
    io.emit("state", publicState());
  });
});

setInterval(() => {
  if (Date.now() >= state.roundEndsAt) {
    advanceRound("The 15-minute round timer expired.");
    broadcast();
  }
}, 1000);

if (!state.feed.length) log("TEK CITY is online. Join, roll, found districts, and build the city together.", "round");

server.listen(PORT, () => console.log(`TEK CITY live board running on port ${PORT} (round = ${ROUND_SECONDS}s)`));
