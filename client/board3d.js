// TEK CITY 3D board (Three.js, bundled locally). Pure view layer: it renders server state and
// reports clicks. It never decides outcomes; rolls and positions come from the server.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const CREAM = "#f4ecd8", INK = "#15211b", GOLD = "#c9972b", YELLOW = "#e2b33c", GREEN_DARK = "#0f2a1f";
const CELL = 1, GAP = 0.06, TILE_H = 0.14;

function gridPos(i) {
  if (i <= 6) return { row: 7, col: 7 - i };
  if (i <= 12) return { row: 7 - (i - 6), col: 1 };
  if (i <= 18) return { row: 1, col: 1 + (i - 12) };
  return { row: 1 + (i - 18), col: 7 };
}
const worldOf = (i) => { const g = gridPos(i); return new THREE.Vector3((g.col - 4) * CELL, 0, (g.row - 4) * CELL); };
const CORNERS = new Set([0, 6, 12, 18]);
const STOP_GLYPH = { station: "GO", vault: "VAULT", desk: "DISPATCH", workshop: "WORKSHOP", plaza: "PLAZA" };
const STOP_SUB = { station: "+25 CREDITS", vault: "+10 VAULT", desk: "RANDOM BOOST", workshop: "+20 · +1 ENERGY", plaza: "+5 INFLUENCE" };

export async function loadFonts() {
  try { await Promise.all(["600 30px Fraunces", "800 60px Fraunces", "500 20px PlexMono"].map((f) => document.fonts.load(f))); } catch { /* fallback fonts */ }
}

export function webglAvailable() {
  try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
  catch { return false; }
}

function wrapText(ctx, text, maxW) {
  const words = text.split(" "); const lines = []; let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}

function tileTexture(stop, district, hood) {
  const S = 256, c = document.createElement("canvas"); c.width = c.height = S;
  const x = c.getContext("2d");
  const special = !district;
  x.fillStyle = special ? (stop.type === "station" ? GOLD : stop.type === "vault" ? "#3a3418" : "#1d4634") : CREAM;
  x.fillRect(0, 0, S, S);
  const fg = special && stop.type !== "station" ? CREAM : INK;
  if (district) {
    x.fillStyle = hood.color; x.fillRect(0, 0, S, 58);
    for (let n = 0; n < 5; n++) { x.fillStyle = n < district.level ? "#fff" : "rgba(255,255,255,.3)"; x.fillRect(38 + n * 38, 22, 30, 12); }
  } else {
    x.strokeStyle = stop.type === "station" ? "rgba(21,33,27,.35)" : "rgba(226,179,60,.55)"; x.lineWidth = 6; x.strokeRect(10, 10, S - 20, S - 20);
  }
  x.fillStyle = fg; x.textAlign = "center"; x.textBaseline = "middle";
  x.font = `600 ${special ? 30 : 34}px Fraunces, Georgia, serif`;
  const lines = wrapText(x, stop.name, S - 36).slice(0, 2);
  const y0 = district ? 112 : 90;
  lines.forEach((l, i) => x.fillText(l, S / 2, y0 + i * 38));
  x.font = "500 20px PlexMono, monospace";
  x.fillStyle = special ? (stop.type === "station" ? "rgba(21,33,27,.75)" : "rgba(244,236,216,.75)") : "#6a776e";
  if (district) {
    x.fillText(district.next ? `LEVEL ${district.level}` : "COMPLETE", S / 2, 200);
    x.fillStyle = "rgba(21,33,27,.12)"; x.fillRect(48, 222, S - 96, 8);
    x.fillStyle = hood.color; x.fillRect(48, 222, (S - 96) * (district.next ? Math.min(1, district.xp / district.next) : 1), 8);
  } else {
    x.font = `800 ${stop.type === "station" ? 54 : 26}px ${stop.type === "station" ? "Fraunces, Georgia, serif" : "PlexMono, monospace"}`;
    x.fillStyle = stop.type === "station" ? INK : YELLOW;
    x.fillText(STOP_GLYPH[stop.type] || "", S / 2, 168);
    x.font = "500 18px PlexMono, monospace"; x.fillStyle = stop.type === "station" ? "rgba(21,33,27,.75)" : "rgba(244,236,216,.7)";
    x.fillText(STOP_SUB[stop.type] || "", S / 2, 214);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function centerTexture() {
  const S = 1024, c = document.createElement("canvas"); c.width = c.height = S;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(S / 2, S / 2, 40, S / 2, S / 2, S * 0.7);
  g.addColorStop(0, "#1c4a35"); g.addColorStop(1, "#0d2519");
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  x.strokeStyle = "rgba(201,151,43,.45)"; x.lineWidth = 6; x.strokeRect(24, 24, S - 48, S - 48);
  x.strokeStyle = "rgba(201,151,43,.18)"; x.lineWidth = 2;
  for (let i = 1; i < 8; i++) { x.beginPath(); x.moveTo((S / 8) * i, 30); x.lineTo((S / 8) * i, S - 30); x.stroke(); x.beginPath(); x.moveTo(30, (S / 8) * i); x.lineTo(S - 30, (S / 8) * i); x.stroke(); }
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = CREAM; x.font = "800 128px Fraunces, Georgia, serif"; x.fillText("TEK CITY", S / 2, 170);
  x.fillStyle = GOLD; x.font = "500 30px PlexMono, monospace"; x.fillText("BUILD THE CITY · OWN THE CULTURE", S / 2, 260);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function dieFace(n) {
  const S = 128, c = document.createElement("canvas"); c.width = c.height = S;
  const x = c.getContext("2d");
  x.fillStyle = "#fbf6ea"; x.fillRect(0, 0, S, S);
  const P = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]], 5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]] }[n];
  x.fillStyle = n === 1 ? "#b6463a" : INK;
  for (const [a, b] of P) { x.beginPath(); x.arc((a * S) / 4, (b * S) / 4, 11, 0, Math.PI * 2); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
// BoxGeometry material order: +x, -x, +y, -y, +z, -z. Opposite faces sum to 7.
const FACE_VALUES = [3, 4, 1, 6, 2, 5];
const TOP_ROT = { 1: [0, 0], 6: [Math.PI, 0], 2: [-Math.PI / 2, 0], 5: [Math.PI / 2, 0], 3: [0, Math.PI / 2], 4: [0, -Math.PI / 2] };

function pawn(color, scale = 1, ring = false) {
  const grp = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.15 });
  const pts = [[0, 0], [0.16, 0], [0.16, 0.04], [0.1, 0.08], [0.07, 0.2], [0.05, 0.28], [0.09, 0.3], [0, 0.31]].map(([a, b]) => new THREE.Vector2(a, b));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat); body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.085, 20, 16), mat); head.position.y = 0.37; head.castShadow = true;
  grp.add(body, head);
  if (ring) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 32), new THREE.MeshStandardMaterial({ color: YELLOW, emissive: YELLOW, emissiveIntensity: 0.8 }));
    r.rotation.x = Math.PI / 2; r.position.y = 0.02; grp.add(r); grp.userData.ring = r;
  }
  grp.scale.setScalar(scale);
  return grp;
}

export class Board3D {
  constructor(container, { onSelect }) {
    this.container = container; this.onSelect = onSelect;
    this.tiles = new Map(); this.buildings = new Map(); this.others = []; this.me = null; this.myColor = null; this.myPos = null;
    this.sig = new Map();
    const w = container.clientWidth || 600, h = container.clientHeight || 600;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setSize(w, h);
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.append(r.domElement);
    r.domElement.setAttribute("aria-label", "TEK CITY 3D board"); r.domElement.setAttribute("role", "img");

    const scene = this.scene = new THREE.Scene();
    const cam = this.camera = new THREE.PerspectiveCamera(36, w / h, 0.1, 100);
    this.mobile = window.matchMedia("(max-width: 900px)").matches;
    this.fit();

    scene.add(new THREE.HemisphereLight(0xfff4dc, 0x0b2318, 1.1));
    const sun = new THREE.DirectionalLight(0xffe7b8, 2.2);
    sun.position.set(-5, 10, 6); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
    sun.shadow.bias = -0.0008; scene.add(sun);
    const rim = new THREE.DirectionalLight(0x8fb6dd, 0.5); rim.position.set(6, 4, -6); scene.add(rim);

    // Board body: gold-trimmed slab + center plaza
    const trim = new THREE.Mesh(new THREE.BoxGeometry(7.75, 0.28, 7.75), new THREE.MeshStandardMaterial({ color: 0x8a6a1f, roughness: 0.45, metalness: 0.5 }));
    trim.position.y = -0.2; trim.receiveShadow = true; scene.add(trim);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(7.55, 0.3, 7.55), new THREE.MeshStandardMaterial({ color: 0x10301f, roughness: 0.9 }));
    slab.position.y = -0.12; slab.receiveShadow = true; scene.add(slab);
    const center = new THREE.Mesh(new THREE.PlaneGeometry(4.94, 4.94), new THREE.MeshStandardMaterial({ map: centerTexture(), roughness: 0.85 }));
    center.rotation.x = -Math.PI / 2; center.position.y = 0.035; center.receiveShadow = true; scene.add(center);

    // Vault tower in the plaza, grows with Vault progress
    this.vault = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.7, 0.18, 40), new THREE.MeshStandardMaterial({ color: 0x8a6a1f, metalness: 0.6, roughness: 0.35 }));
    base.position.y = 0.12; base.castShadow = true; base.receiveShadow = true;
    this.vaultCore = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 1, 40), new THREE.MeshStandardMaterial({ color: GOLD, emissive: 0x6b4a0c, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.25 }));
    this.vaultCore.castShadow = true;
    this.vaultRing = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.035, 10, 64), new THREE.MeshStandardMaterial({ color: YELLOW, emissive: YELLOW, emissiveIntensity: 0.9 }));
    this.vaultRing.rotation.x = Math.PI / 2; this.vaultRing.position.y = 0.06;
    this.vault.add(base, this.vaultCore, this.vaultRing); this.vault.position.set(0, 0, 0.45); scene.add(this.vault);
    this.setVault(0);

    // Die
    const mats = FACE_VALUES.map((v) => new THREE.MeshStandardMaterial({ map: dieFace(v), roughness: 0.4 }));
    this.die = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.52, 0.52), mats);
    this.die.castShadow = true; this.die.position.set(1.55, 0.3, 1.25); scene.add(this.die);
    this.setDie(1, false);

    // Crisis marker
    this.crisis = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.04, 10, 48), new THREE.MeshStandardMaterial({ color: 0xb6463a, emissive: 0xb6463a, emissiveIntensity: 1.2 }));
    this.crisis.rotation.x = Math.PI / 2; this.crisis.visible = false; scene.add(this.crisis);
    this.hoverMesh = null;

    // Controls: drag to rotate on desktop; fixed camera on touch so page scrolling works
    this.controls = new OrbitControls(cam, r.domElement);
    Object.assign(this.controls, { enablePan: false, enableDamping: true, dampingFactor: 0.08, minDistance: 7, maxDistance: 18, minPolarAngle: 0.25, maxPolarAngle: 1.15, rotateSpeed: 0.6 });
    this.controls.target.set(0, 0, 0.35);
    if (this.mobile) { this.controls.enabled = false; r.domElement.style.touchAction = "pan-y"; }

    this.ray = new THREE.Raycaster(); this.ptr = new THREE.Vector2(); this.down = null;
    r.domElement.addEventListener("pointerdown", (e) => { this.down = [e.clientX, e.clientY]; });
    r.domElement.addEventListener("pointerup", (e) => {
      if (!this.down || Math.hypot(e.clientX - this.down[0], e.clientY - this.down[1]) > 6) return;
      const hit = this.pick(e); if (hit !== null) this.onSelect(hit);
    });
    r.domElement.addEventListener("pointermove", (e) => { if (this.mobile) return; const id = this.pick(e); this.hover(id); r.domElement.style.cursor = id !== null ? "pointer" : "grab"; });

    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(container);
    this.clock = new THREE.Clock(); this.anims = [];
    const loop = () => { this.frame = requestAnimationFrame(loop); this.tick(); };
    loop();
  }

  pick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ptr.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(this.ptr, this.camera);
    const hits = this.ray.intersectObjects([...this.tiles.values(), ...[...this.buildings.values()].flatMap((g) => g.children)], false);
    for (const h of hits) { let o = h.object; while (o && o.userData.stop === undefined) o = o.parent; if (o) return o.userData.stop; }
    return null;
  }
  hover(id) {
    if (this.hoverId === id) return;
    if (this.hoverId !== undefined && this.hoverId !== null) { const t = this.tiles.get(this.hoverId); if (t) t.position.y = 0; }
    this.hoverId = id;
    if (id !== null) { const t = this.tiles.get(id); if (t) t.position.y = 0.05; }
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.fit();
  }

  // Frame the whole board for the current aspect ratio (keeps every edge space on screen).
  fit() {
    const cam = this.camera, a = cam.aspect || 1;
    const elev = (this.mobile ? 66 : 52) * Math.PI / 180;
    const vt = Math.tan((cam.fov * Math.PI) / 360), ht = vt * a;
    const d = Math.max(4.1 / ht, (this.mobile ? 3.2 : 3.55) / vt) + (this.mobile ? 1.4 : 2.2);
    const tz = this.mobile ? -0.45 : 0.2;
    cam.position.set(0, Math.sin(elev) * d, Math.cos(elev) * d + tz);
    cam.lookAt(0, 0, tz);
    if (this.controls) { this.controls.target.set(0, 0, tz); this.controls.update(); }
  }

  // ---------------------------------------------------------------- state
  update(city, me) {
    for (const s of city.stops) {
      const d = city.districts.find((x) => x.id === s.id);
      const hood = s.hood ? city.neighborhoods[s.hood] : null;
      const sig = d ? `${d.level}:${d.xp}:${d.next}` : "s";
      if (this.sig.get(s.id) !== sig) { this.sig.set(s.id, sig); this.buildTile(s, d, hood); }
    }
    // crisis
    const ev = city.event;
    if (ev && ev.kind === "crisis") { const p = worldOf(ev.target); this.crisis.position.set(p.x, 0.17, p.z); this.crisis.visible = true; }
    else this.crisis.visible = false;
    // vault
    const v = city.vault; this.setVault((v.progress - v.milestone * v.milestoneSize) / v.milestoneSize, v.milestone);
    this.lastCity = city; this.lastMe = me;
    // other players
    for (const o of this.others) this.scene.remove(o);
    this.others = [];
    const byPos = new Map();
    for (const p of city.players) {
      if (me.signedIn && p.name === me.user.name) continue;
      if (!byPos.has(p.position)) byPos.set(p.position, []);
      byPos.get(p.position).push(p);
    }
    for (const [pos, ps] of byPos) {
      const c = worldOf(pos);
      ps.slice(0, 6).forEach((p, i) => {
        const t = pawn(this.colorFor(p.seed || p.name), 0.75);
        const a = (i / Math.min(6, ps.length)) * Math.PI * 2;
        t.position.set(c.x - 0.25 + Math.cos(a) * 0.12, TILE_H + 0.01, c.z + 0.22 + Math.sin(a) * 0.08);
        this.scene.add(t); this.others.push(t);
      });
    }
    // me
    if (me.signedIn) {
      const col = this.colorFor(me.user.seed || me.user.name);
      if (!this.me || this.myColor !== col) { if (this.me) this.scene.remove(this.me); this.me = pawn(col, 1.35, true); this.myColor = col; this.scene.add(this.me); this.myPos = null; }
      if (this.myPos === null || (!this.moving && this.myPos !== me.position)) { this.placeMe(me.position); }
    } else if (this.me) { this.scene.remove(this.me); this.me = null; }
  }

  colorFor(seed) {
    const palette = ["#e2b33c", "#c9972b", "#8fb6dd", "#9fd8b2", "#f2a99e", "#d9cba6", "#b8d0e8", "#f3d68f"];
    let n = 0; for (const ch of String(seed || "x")) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
    return palette[n % palette.length];
  }

  spot(pos) { const c = worldOf(pos); return new THREE.Vector3(c.x + 0.18, TILE_H + 0.01, c.z + 0.12); }
  placeMe(pos) { if (!this.me) return; this.myPos = pos; this.me.position.copy(this.spot(pos)); }

  buildTile(stop, district, hood) {
    const old = this.tiles.get(stop.id);
    if (old) { this.scene.remove(old); old.material[2].map.dispose(); }
    const side = new THREE.MeshStandardMaterial({ color: district ? 0xe8dcc0 : 0x173d2d, roughness: 0.8 });
    const top = new THREE.MeshStandardMaterial({ map: tileTexture(stop, district, hood), roughness: 0.7 });
    const size = CELL - GAP;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, TILE_H, size), [side, side, top, side, side, side]);
    const p = worldOf(stop.id); mesh.position.set(p.x, 0, p.z); mesh.geometry.translate(0, TILE_H / 2, 0);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.stop = stop.id;
    this.scene.add(mesh); this.tiles.set(stop.id, mesh);

    const oldB = this.buildings.get(stop.id); if (oldB) this.scene.remove(oldB);
    if (!district) { this.buildings.delete(stop.id); return; }
    // Buildings: one tower per level, rising floors. Complete districts get a gold crown.
    const g = new THREE.Group(); g.userData.stop = stop.id;
    const col = new THREE.Color(hood.color);
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.55, metalness: 0.1 });
    const glass = new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xffd77a, emissiveIntensity: 0.35, roughness: 0.3 });
    const slots = [[-0.3, -0.06], [0.3, -0.06], [-0.1, -0.12], [0.1, -0.12], [0, 0.02]];
    for (let n = 0; n < district.level; n++) {
      const hgt = 0.22 + n * 0.12 + (n === 3 ? 0.14 : 0);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.17, hgt, 0.17), mat);
      b.position.set(slots[n][0], TILE_H + hgt / 2, slots[n][1]); b.castShadow = true; b.receiveShadow = true; b.userData.stop = stop.id;
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.175, 0.03, 0.175), glass);
      win.position.set(slots[n][0], TILE_H + hgt * 0.7, slots[n][1]); win.userData.stop = stop.id;
      g.add(b, win);
    }
    if (!district.next) {
      const crown = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.18, 4), new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.8, roughness: 0.2, emissive: 0x6b4a0c }));
      crown.position.set(0, TILE_H + 0.22 + 4 * 0.12 + 0.09, 0.02); crown.userData.stop = stop.id; g.add(crown);
    }
    // Buildings sit on the inner half so text stays readable
    g.position.set(p.x, 0, p.z - 0.3);
    g.children.forEach((c) => { c.position.z *= 0.5; c.position.x *= 0.95; });
    this.scene.add(g); this.buildings.set(stop.id, g);
    if (old) { g.scale.setScalar(0.01); this.tween(380, (k) => g.scale.setScalar(0.01 + 0.99 * this.ease(k))); }
  }

  setVault(frac, milestone = 0) {
    const f = Math.max(0, Math.min(1, frac || 0));
    const h = 0.25 + f * 1.4 + Math.min(3, milestone) * 0.15;
    this.vaultCore.scale.y = h; this.vaultCore.position.y = 0.21 + h / 2;
    this.vaultRing.material.emissiveIntensity = 0.4 + f * 1.4;
  }

  setDie(value, animate = true) {
    const [rx, rz] = TOP_ROT[value] || [0, 0];
    if (!animate) { this.die.rotation.set(rx, 0, rz); return Promise.resolve(); }
    const start = this.die.rotation.clone();
    const spins = 2 + Math.floor(Math.random() * 2);
    const end = new THREE.Euler(rx + spins * Math.PI * 2, (Math.random() - 0.5) * 0.6, rz + spins * Math.PI * 2);
    const y0 = 0.3;
    return this.tween(900, (k) => {
      const e = this.ease(k);
      this.die.rotation.set(start.x + (end.x - start.x) * e, start.y + (end.y - start.y) * e, start.z + (end.z - start.z) * e);
      this.die.position.y = y0 + Math.sin(k * Math.PI) * 1.1;
    }).then(() => { this.die.rotation.set(rx, end.y, rz); this.die.position.y = y0; });
  }

  async move(path, roll) {
    this.moving = true;
    await this.setDie(roll, true);
    for (const id of path) {
      if (!this.me) break;
      const from = this.me.position.clone(), to = this.spot(id);
      await this.tween(240, (k) => { this.me.position.lerpVectors(from, to, k); this.me.position.y = TILE_H + 0.01 + Math.sin(k * Math.PI) * 0.35; });
      const t = this.tiles.get(id); if (t) this.tween(200, (k) => { t.position.y = Math.sin(k * Math.PI) * 0.06; });
      this.myPos = id;
    }
    this.moving = false;
  }

  ease(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  tween(ms, fn) { return new Promise((res) => this.anims.push({ t0: performance.now(), ms, fn, res })); }

  tick() {
    const now = performance.now(), t = this.clock.getElapsedTime();
    this.anims = this.anims.filter((a) => { const k = Math.min(1, (now - a.t0) / a.ms); a.fn(k); if (k >= 1) { a.res(); return false; } return true; });
    if (this.crisis.visible) { const s = 1 + Math.sin(t * 4) * 0.08; this.crisis.scale.set(s, s, s); }
    this.vaultRing.rotation.z = t * 0.4;
    if (this.me && this.me.userData.ring) this.me.userData.ring.material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3;
    if (this.controls.enabled) this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
