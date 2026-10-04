// Starts the server, joins two players, plays 40 rounds, checks invariants.
const { spawn } = require("child_process");
const { io } = require("socket.io-client");
const PORT = 3999;
const srv = spawn("node", ["server.js"], { env: { ...process.env, PORT, ROUND_SECONDS: 900 }, stdio: "inherit" });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const emit = (s, ev, data) => new Promise((r) => s.emit(ev, data, r));
(async () => {
  await wait(800);
  const a = io(`http://localhost:${PORT}`), b = io(`http://localhost:${PORT}`);
  let state; a.on("state", (s) => (state = s));
  await wait(300);
  await emit(a, "reset", {});
  await wait(200);
  const ra = await emit(a, "join", { name: "Alice" });
  const rb = await emit(b, "join", { name: "Bob" });
  if (!ra.playerId || !rb.playerId) throw new Error("join failed");
  for (let i = 0; i < 40; i++) {
    for (const [s, id] of [[a, ra.playerId], [b, rb.playerId]]) {
      const r = await emit(s, "roll", {});
      await wait(30);
      const p = state.players.find((x) => x.id === id);
      if (p.pending) await emit(s, "resolve", { accept: Math.random() < 0.7, target: 5 });
      await wait(30);
    }
  }
  const dup = await emit(a, "roll", {});
  const total = state.players.reduce((t, p) => t + p.credits, 0);
  console.log("round", state.round, "vault", state.vault, "districts", Object.keys(state.districts).length);
  state.players.forEach((p) => console.log(p.name, "pos", p.pos, "credits", p.credits, "NW", p.netWorth));
  console.log("feed sample:\n " + state.feed.slice(0, 8).map((f) => f.text).join("\n "));
  if (state.round < 30) throw new Error("rounds did not advance");
  if (state.players.some((p) => p.credits < 0)) throw new Error("negative credits");
  console.log("SMOKE TEST PASSED");
  await emit(a, "reset", {});
  a.close(); b.close(); srv.kill(); process.exit(0);
})().catch((e) => { console.error("FAIL", e); srv.kill(); process.exit(1); });
