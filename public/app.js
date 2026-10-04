/* TEK CITY live board client */
(() => {
  const socket = io();
  const $ = (id) => document.getElementById(id);
  const ICONS = { gate: "⛩", grid: "ϟ", nexus: "◎", launch: "🚀", vault: "◈", event: "✷", transit: "⇄" };
  const TYPE_LABEL = { gate: "Start", grid: "Corner", nexus: "Corner", launch: "Corner", vault: "Vault", event: "Event", transit: "Maglev", district: "District" };

  let board = [];
  let rules = {};
  let st = null;
  let me = localStorage.getItem("tekcity.playerId");
  let selected = null;
  let lastSeq = null;
  const shown = {}; // pid -> displayed position (for animation)
  let animating = false;
  let clockSkew = 0;

  // ---------- grid geometry: 36 spaces around a 10x10 board, The Gate at bottom-right
  function cellFor(i) {
    if (i === 0) return [10, 10];
    if (i < 9) return [10, 10 - i];
    if (i === 9) return [10, 1];
    if (i < 18) return [10 - (i - 9), 1];
    if (i === 18) return [1, 1];
    if (i < 27) return [1, 1 + (i - 18)];
    if (i === 27) return [1, 10];
    return [1 + (i - 27), 10];
  }
  function sideFor(i) {
    if (i % 9 === 0) return "corner";
    return ["bottom", "left", "top", "right"][Math.floor(i / 9)];
  }

  function buildBoard() {
    const el = $("board");
    el.querySelectorAll(".space").forEach((n) => n.remove());
    board.forEach((s) => {
      const [r, c] = cellFor(s.id);
      const d = document.createElement("button");
      d.className = `space ${s.type} side-${sideFor(s.id)}`;
      d.style.gridRow = r;
      d.style.gridColumn = c;
      d.dataset.id = s.id;
      if (s.color) d.style.setProperty("--sector", s.color);
      d.innerHTML = `
        ${s.type === "district" ? '<span class="strip"></span>' : `<span class="icon">${ICONS[s.type] || ""}</span>`}
        <span class="sname">${s.name}</span>
        <span class="smeta">${s.type === "district" ? s.cost : TYPE_LABEL[s.type]}</span>
        <span class="pips"></span>
        <span class="owners"></span>`;
      d.addEventListener("click", () => { selected = s.id; renderInspect(); highlight(); });
      el.appendChild(d);
    });
  }

  function highlight() {
    document.querySelectorAll(".space").forEach((n) => n.classList.toggle("selected", Number(n.dataset.id) === selected));
  }

  // ---------- tokens
  function tokenEl(p) {
    let t = document.querySelector(`.token[data-pid="${p.id}"]`);
    if (!t) {
      t = document.createElement("div");
      t.className = "token";
      t.dataset.pid = p.id;
      $("tokenLayer").appendChild(t);
    }
    t.style.setProperty("--c", p.color);
    t.textContent = p.token;
    t.title = p.name;
    t.classList.toggle("mine", p.id === me);
    t.classList.toggle("offline", !p.online);
    return t;
  }
  function placeTokens() {
    if (!st) return;
    const boardRect = $("board").getBoundingClientRect();
    const groups = {};
    st.players.forEach((p) => {
      const pos = shown[p.id] ?? p.pos;
      (groups[pos] = groups[pos] || []).push(p);
    });
    document.querySelectorAll(".token").forEach((t) => { if (!st.players.find((p) => p.id === t.dataset.pid)) t.remove(); });
    Object.entries(groups).forEach(([pos, list]) => {
      const cell = document.querySelector(`.space[data-id="${pos}"]`);
      if (!cell) return;
      const r = cell.getBoundingClientRect();
      const size = Math.max(16, Math.min(28, r.width * 0.34));
      list.forEach((p, k) => {
        const t = tokenEl(p);
        const cols = list.length > 4 ? 3 : 2;
        const n = list.length;
        const ox = n === 1 ? 0 : ((k % cols) - (Math.min(n, cols) - 1) / 2) * size * 0.9;
        const oy = n === 1 ? 0 : (Math.floor(k / cols) - (Math.ceil(n / cols) - 1) / 2) * size * 0.9;
        t.style.width = t.style.height = `${size}px`;
        t.style.fontSize = `${size * 0.52}px`;
        t.style.transform = `translate(${r.left - boardRect.left + r.width / 2 - size / 2 + ox}px, ${r.top - boardRect.top + r.height / 2 - size / 2 + oy + 6}px)`;
      });
    });
  }

  async function animateMove(move) {
    if (!move || !move.path || !move.path.length) return;
    animating = true;
    const pid = move.pid;
    showDice(move.dice, true);
    for (const pos of move.path) {
      shown[pid] = pos;
      placeTokens();
      await new Promise((r) => setTimeout(r, 190));
    }
    delete shown[pid];
    animating = false;
    if (move.card) flashCard(move.card);
    render();
  }

  function showDice(dice, spin) {
    const [a, b] = dice || ["–", "–"];
    const d1 = $("d1"), d2 = $("d2");
    d1.textContent = a; d2.textContent = b;
    if (spin) { [d1, d2].forEach((d) => { d.classList.remove("spin"); void d.offsetWidth; d.classList.add("spin"); }); }
  }

  function flashCard(card) {
    const el = $("cardFlash");
    el.innerHTML = `<span class="label">${card.deck}</span><p>${card.text}</p>`;
    el.classList.remove("hidden");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add("hidden"), 4200);
  }

  // ---------- rendering
  const fmt = (n) => Number(n || 0).toLocaleString();
  const myPlayer = () => st && st.players.find((p) => p.id === me);
  const playerById = (id) => st && st.players.find((p) => p.id === id);

  function renderSpaces() {
    document.querySelectorAll(".space").forEach((n) => {
      const id = Number(n.dataset.id);
      const d = st.districts[id];
      n.classList.toggle("founded", !!d);
      const pips = n.querySelector(".pips");
      const owners = n.querySelector(".owners");
      if (d) {
        pips.innerHTML = Array.from({ length: 5 }, (_, k) => `<i class="${k <= d.level ? "on" : ""}"></i>`).join("");
        owners.innerHTML = Object.keys(d.shares).map((pid) => { const p = playerById(pid); return p ? `<b style="--c:${p.color}"></b>` : ""; }).join("");
        n.querySelector(".smeta").textContent = `Toll ${d.toll}`;
      } else {
        pips.innerHTML = ""; owners.innerHTML = "";
        const s = board[id];
        n.querySelector(".smeta").textContent = s.type === "district" ? s.cost : TYPE_LABEL[s.type];
      }
    });
  }

  function renderInspect() {
    const body = $("inspectBody");
    if (selected == null || !board[selected]) return;
    const s = board[selected];
    const d = st && st.districts[selected];
    let html = `<div class="ins-title">${s.type === "district" ? `<span class="swatch" style="background:${s.color}"></span>` : `<span class="ins-icon">${ICONS[s.type]}</span>`}<div><strong>${s.name}</strong><div class="muted">${s.type === "district" ? s.sectorName : TYPE_LABEL[s.type]} · space ${s.id}</div></div></div><p>${s.text}</p>`;
    if (s.type === "district") {
      if (d) {
        const total = Object.values(d.shares).reduce((a, b) => a + b, 0);
        html += `<div class="ins-grid"><div><span class="label">Level</span><strong>${d.level + 1} / 5</strong></div><div><span class="label">Toll</span><strong>${d.toll}</strong></div><div><span class="label">Next upgrade</span><strong>${d.upgradeCost ?? "MAX"}</strong></div></div>`;
        html += `<div class="label" style="margin-top:10px">Shareholders</div><ul class="shares">` + Object.entries(d.shares).map(([pid, v]) => { const p = playerById(pid); return `<li><span><b style="--c:${p ? p.color : "#888"}"></b>${p ? p.name : "Former player"}${pid === d.founder ? " · founder" : ""}</span><span>${Math.round((v / total) * 100)}%</span></li>`; }).join("") + "</ul>";
      } else {
        html += `<div class="ins-grid"><div><span class="label">Found cost</span><strong>${s.cost}</strong></div><div><span class="label">Base toll</span><strong>${Math.round(s.cost / 8)}</strong></div><div><span class="label">Status</span><strong>Open</strong></div></div>`;
      }
    }
    const here = st ? st.players.filter((p) => p.pos === s.id).map((p) => p.name) : [];
    if (here.length) html += `<p class="muted" style="margin-top:10px">On this space: ${here.join(", ")}</p>`;
    body.classList.remove("muted");
    body.innerHTML = html;
  }

  function renderPlayers() {
    $("playerCount").textContent = `${st.players.length} / 8`;
    const sorted = [...st.players].sort((a, b) => b.netWorth - a.netWorth);
    $("players").innerHTML = sorted.length ? sorted.map((p, i) => `
      <li class="${p.id === me ? "is-me" : ""}">
        <span class="ptoken" style="--c:${p.color}">${p.token}</span>
        <div class="pinfo"><strong>${p.name}${p.id === me ? " (you)" : ""}</strong><span class="muted">${board[p.pos] ? board[p.pos].name : ""}</span></div>
        <div class="pnums"><strong>${fmt(p.credits)}</strong><span class="muted">#${i + 1} · NW ${fmt(p.netWorth)}</span></div>
        <span class="pstatus ${!p.online ? "off" : p.pending ? "act" : p.rolled ? "done" : "wait"}">${!p.online ? "offline" : p.pending ? "deciding" : p.rolled ? "rolled" : "to roll"}</span>
      </li>`).join("") : `<li class="muted">No players yet. Join to start the city.</li>`;
  }

  function renderFeed() {
    $("feed").innerHTML = st.feed.map((f) => `<li class="k-${f.kind}"><span class="ftime">D${f.day} R${f.round}</span>${f.text}</li>`).join("");
  }

  function renderMe() {
    const p = myPlayer();
    $("joinPanel").hidden = !!p;
    $("mePanel").hidden = !p;
    $("leaveBtn").disabled = !p;
    if (!p) {
      $("rollBtn").disabled = true;
      $("turnTitle").textContent = "Join to play";
      $("turnText").textContent = "Enter a name to get a token and 1,500 virtual credits.";
      $("actionPanel").classList.add("hidden");
      return;
    }
    $("meToken").textContent = p.token;
    $("meToken").style.setProperty("--c", p.color);
    $("meName").textContent = p.name;
    $("mePos").textContent = `On ${board[p.pos].name}`;
    $("meCredits").textContent = fmt(p.credits);
    $("meWorth").textContent = fmt(p.netWorth);
    $("meHeld").textContent = Object.values(st.districts).filter((d) => d.shares[p.id]).length;
    if (p.lastRoll && !animating) showDice(p.lastRoll, false);

    const roll = $("rollBtn");
    roll.disabled = p.rolled || !!p.pending || animating;
    if (p.pending) { $("turnTitle").textContent = "Your move"; $("turnText").textContent = "Make a decision below."; }
    else if (p.rolled) { $("turnTitle").textContent = "Turn complete"; $("turnText").textContent = "Waiting for other players or the round timer."; }
    else { $("turnTitle").textContent = "Your roll is ready"; $("turnText").textContent = "Roll two dice and move around the city."; }
    renderAction(p);
  }

  function renderAction(p) {
    const el = $("actionPanel");
    if (!p.pending || animating) { el.classList.add("hidden"); el.innerHTML = ""; return; }
    const pend = p.pending;
    const s = board[pend.space];
    const afford = p.credits >= pend.cost;
    let html = "";
    if (pend.type === "found") {
      html = `<span class="label">Unclaimed district</span><h3><span class="swatch" style="background:${s.color}"></span>${s.name}</h3><p>Found it for <b>${pend.cost}</b> credits. You become founder and 100% shareholder. Base toll ${Math.round(s.cost / 8)}.</p>
        <div class="action-row"><button class="btn primary" data-accept="1" ${afford ? "" : "disabled"}>Found for ${pend.cost}</button><button class="btn ghost" data-accept="0">Pass</button></div>`;
    } else if (pend.type === "invest") {
      const d = st.districts[pend.space];
      html = `<span class="label">Co-op build</span><h3><span class="swatch" style="background:${s.color}"></span>${s.name} · Level ${d.level + 1}</h3><p>Invest <b>${pend.cost}</b> to raise it to level ${d.level + 2}. You gain shares and earn part of every toll here.</p>
        <div class="action-row"><button class="btn primary" data-accept="1" ${afford ? "" : "disabled"}>Invest ${pend.cost}</button><button class="btn ghost" data-accept="0">Skip</button></div>`;
    } else if (pend.type === "launch") {
      const opts = board.filter((b) => b.id !== 27).map((b) => `<option value="${b.id}">${b.id} · ${b.name}${st.districts[b.id] ? " (founded)" : b.type === "district" ? " (open)" : ""}</option>`).join("");
      html = `<span class="label">Launch Pad</span><h3>Choose a destination</h3><p>Pay <b>50</b> to launch anywhere. Passing The Gate still pays ${rules.gate}.</p>
        <select id="launchTarget">${opts}</select>
        <div class="action-row"><button class="btn primary" data-accept="1" ${afford ? "" : "disabled"}>Launch for 50</button><button class="btn ghost" data-accept="0">Stay</button></div>`;
    }
    if (!afford) html += `<p class="error">Not enough credits.</p>`;
    // avoid rebuilding while the user is choosing a launch target
    const sig = JSON.stringify(pend) + afford;
    if (el.dataset.sig === sig) return;
    el.dataset.sig = sig;
    el.innerHTML = html;
    el.classList.remove("hidden");
    el.querySelectorAll("[data-accept]").forEach((b) => b.addEventListener("click", () => {
      const accept = b.dataset.accept === "1";
      const target = $("launchTarget") ? Number($("launchTarget").value) : undefined;
      socket.emit("resolve", { accept, target }, (r) => r && r.error && toast(r.error));
    }));
  }

  function renderClock() {
    if (!st) return;
    $("clock").textContent = st.clock;
    $("roundLabel").textContent = `Round ${st.round} / ${st.roundsPerDay} · Day ${st.day}`;
    $("vault").textContent = fmt(st.vault);
    const left = Math.max(0, st.roundEndsAt - (Date.now() + clockSkew));
    const s = Math.ceil(left / 1000);
    $("countdown").textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    $("roundBar").style.width = `${100 - (left / (st.roundSeconds * 1000)) * 100}%`;
  }

  function render() {
    if (!st || !board.length) return;
    renderSpaces();
    renderPlayers();
    renderFeed();
    renderMe();
    renderClock();
    if (selected != null) renderInspect();
    placeTokens();
  }

  function toast(msg) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // ---------- socket events
  socket.on("connect", () => { if (me) socket.emit("hello", { playerId: me }); });
  socket.on("board", (b) => { board = b.board; rules = b.rules; buildBoard(); render(); });
  socket.on("you", ({ playerId }) => {
    me = playerId;
    if (me) localStorage.setItem("tekcity.playerId", me); else localStorage.removeItem("tekcity.playerId");
    $("actionPanel").dataset.sig = "";
    render();
  });
  socket.on("state", (s) => {
    const prevSeq = lastSeq;
    const prevState = st;
    st = s;
    clockSkew = s.serverNow - Date.now();
    if (me && !s.players.find((p) => p.id === me)) { me = null; localStorage.removeItem("tekcity.playerId"); }
    if (s.lastMove && prevSeq !== null && s.lastMove.seq !== prevSeq) {
      lastSeq = s.lastMove.seq;
      const mover = s.players.find((p) => p.id === s.lastMove.pid);
      if (mover) {
        // start animation from where the token was before the move
        const old = prevState && prevState.players.find((p) => p.id === mover.id);
        shown[mover.id] = old ? old.pos : mover.pos;
        render();
        animateMove(s.lastMove);
        return;
      }
    }
    lastSeq = s.lastMove ? s.lastMove.seq : 0;
    render();
  });

  // ---------- UI events
  $("joinForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("nameInput").value.trim();
    socket.emit("join", { name }, (r) => {
      if (r.error) { $("joinError").textContent = r.error; return; }
      $("joinError").textContent = "";
      me = r.playerId;
      localStorage.setItem("tekcity.playerId", me);
      render();
    });
  });
  $("rollBtn").addEventListener("click", () => {
    $("rollBtn").disabled = true;
    socket.emit("roll", {}, (r) => { if (r && r.error) { toast(r.error); render(); } });
  });
  $("skipBtn").addEventListener("click", () => socket.emit("skipRound", {}, () => {}));
  $("leaveBtn").addEventListener("click", () => { if (confirm("Leave the game? Your token and shares will be removed.")) socket.emit("leave", {}, () => {}); });
  $("resetBtn").addEventListener("click", () => { if (confirm("Reset the whole board for everyone?")) socket.emit("reset", {}, () => {}); });

  window.addEventListener("resize", placeTokens);
  setInterval(renderClock, 1000);
})();
