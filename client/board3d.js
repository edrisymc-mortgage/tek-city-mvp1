// TEK CITY 3D board (Three.js, bundled locally). Pure view layer: it renders server state and
// reports clicks. It never decides outcomes; spins and positions come from the server.
//
// Look: a physical architectural model on a walnut table. Physically based materials, image-based
// lighting, soft shadows, ambient occlusion and a subtle tilt-shift lens on desktop.
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

const INK = "#16171a", PAPER = "#eceae4", MUTED = "#6b6e75";
const SANS = "Geist, system-ui, sans-serif", MONO = "GeistMono, ui-monospace, monospace";
const CELL = 1, GAP = 0.05, TILE_H = 0.12, BOARD_TOP = 0;

function gridPos(i) {
  if (i <= 6) return { row: 7, col: 7 - i };
  if (i <= 12) return { row: 7 - (i - 6), col: 1 };
  if (i <= 18) return { row: 1, col: 1 + (i - 12) };
  return { row: 1 + (i - 18), col: 7 };
}
const worldOf = (i) => { const g = gridPos(i); return new THREE.Vector3((g.col - 4) * CELL, 0, (g.row - 4) * CELL); };
const SPECIAL = { station: ["START", "Spin from here"], vault: ["VAULT", "Win the pool"] };

export async function loadFonts() {
  try { await Promise.all(["600 40px Geist", "500 20px Geist", "500 20px GeistMono"].map((f) => document.fonts.load(f))); } catch { /* fallback */ }
}

export function webglAvailable() {
  try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl"))); }
  catch { return false; }
}

// ------------------------------------------------------------------ procedural textures
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function canvas(S) { const c = document.createElement("canvas"); c.width = c.height = S; return [c, c.getContext("2d")]; }
function tex(c, srgb = true, rep = 1) {
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8; if (rep !== 1) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); }
  return t;
}

function walnut() {
  const S = 1024, [c, x] = canvas(S), [rc, rx] = canvas(S), r = rng(7);
  x.fillStyle = "#3a2619"; x.fillRect(0, 0, S, S);
  rx.fillStyle = "#8a8a8a"; rx.fillRect(0, 0, S, S);
  for (let i = 0; i < 900; i++) {
    const y = r() * S, amp = 4 + r() * 16, f = 0.002 + r() * 0.006, ph = r() * 6.28, w = 0.6 + r() * 2.4;
    const dark = r() < 0.6, a = 0.05 + r() * 0.18;
    x.strokeStyle = dark ? `rgba(22,12,6,${a})` : `rgba(120,78,46,${a * 0.8})`;
    rx.strokeStyle = dark ? `rgba(170,170,170,${a})` : `rgba(90,90,90,${a})`;
    x.lineWidth = rx.lineWidth = w;
    x.beginPath(); rx.beginPath();
    for (let px = 0; px <= S; px += 16) { const py = y + Math.sin(px * f + ph) * amp; if (!px) { x.moveTo(px, py); rx.moveTo(px, py); } else { x.lineTo(px, py); rx.lineTo(px, py); } }
    x.stroke(); rx.stroke();
  }
  return { map: tex(c), rough: tex(rc, false) };
}

function slate() {
  const S = 1024, [c, x] = canvas(S), r = rng(11);
  x.fillStyle = "#17181b"; x.fillRect(0, 0, S, S);
  const img = x.getImageData(0, 0, S, S), d = img.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(img, 0, 0);
  x.strokeStyle = "rgba(255,255,255,.05)"; x.lineWidth = 1;
  for (let i = 1; i < 10; i++) { const p = (S / 10) * i; x.beginPath(); x.moveTo(p, 40); x.lineTo(p, S - 40); x.stroke(); x.beginPath(); x.moveTo(40, p); x.lineTo(S - 40, p); x.stroke(); }
  x.strokeStyle = "rgba(255,255,255,.18)"; x.lineWidth = 2; x.strokeRect(28, 28, S - 56, S - 56);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "rgba(236,234,228,.92)"; x.font = `600 104px ${SANS}`;
  x.save(); x.translate(S / 2, 176); x.fillText("T E K   C I T Y", 0, 0); x.restore();
  x.fillStyle = "rgba(236,234,228,.45)"; x.font = `500 26px ${MONO}`;
  x.fillText("PUMP.FUN LAUNCHPAD  ·  SOLANA  ·  BETA", S / 2, 262);
  x.fillStyle = "rgba(236,234,228,.35)"; x.font = `500 22px ${MONO}`;
  x.fillText("COMMUNITY POOL", S / 2, S - 150);
  return tex(c);
}

// Window grid for architectural model buildings: albedo + emissive (a few lit windows).
function facade(seed) {
  const S = 256, [c, x] = canvas(S), [ec, ex] = canvas(S), r = rng(seed);
  x.fillStyle = "#d9d7d2"; x.fillRect(0, 0, S, S);
  ex.fillStyle = "#000"; ex.fillRect(0, 0, S, S);
  const cols = 6, rows = 12, cw = S / cols, rh = S / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const gx = i * cw + cw * 0.18, gy = j * rh + rh * 0.22, w = cw * 0.64, h = rh * 0.56;
    x.fillStyle = "#2b3036"; x.fillRect(gx, gy, w, h);
    x.fillStyle = "rgba(255,255,255,.08)"; x.fillRect(gx, gy, w, h * 0.35);
    if (r() < 0.22) { ex.fillStyle = `rgba(255,${200 + r() * 30 | 0},${140 + r() * 40 | 0},${0.5 + r() * 0.5})`; ex.fillRect(gx, gy, w, h); }
  }
  const a = tex(c), e = tex(ec);
  a.wrapS = a.wrapT = e.wrapS = e.wrapT = THREE.RepeatWrapping;
  return { map: a, emissiveMap: e };
}

function wrapText(ctx, text, maxW) {
  const words = String(text).split(" "); const lines = []; let line = "";
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; }
  if (line) lines.push(line);
  return lines;
}

// Printed top of a tile (512px). Empty spaces are blank porcelain with only their number.
// Once someone launches a coin there, the coin's image fills the whole space.
function printTexture(stop, coin, img) {
  const S = 512, [c, x] = canvas(S);
  x.textAlign = "center"; x.textBaseline = "middle";
  const special = SPECIAL[stop.type];
  if (coin) {
    x.fillStyle = "#141518"; x.fillRect(0, 0, S, S);
    if (img && img.complete && img.naturalWidth) {
      const k = Math.max(S / img.naturalWidth, S / img.naturalHeight);
      x.drawImage(img, (S - img.naturalWidth * k) / 2, (S - img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k);
    } else { x.fillStyle = "#ecebe6"; x.font = `600 120px ${SANS}`; x.fillText(coin.symbol.slice(0, 4), S / 2, S / 2 - 30); }
    const g = x.createLinearGradient(0, S - 200, 0, S); g.addColorStop(0, "rgba(10,10,12,0)"); g.addColorStop(0.45, "rgba(10,10,12,.7)"); g.addColorStop(1, "rgba(10,10,12,.92)");
    x.fillStyle = g; x.fillRect(0, S - 200, S, 200);
    x.textAlign = "left"; x.fillStyle = "#f4f3ef"; x.font = `600 46px ${SANS}`;
    let name = String(coin.name || coin.symbol); while (x.measureText(name).width > S - 68 && name.length > 3) name = name.slice(0, -2) + "…";
    x.fillText(name, 34, S - 84);
    x.fillStyle = "rgba(244,243,239,.72)"; x.font = `500 26px ${MONO}`;
    x.fillText(`$${coin.symbol}`.slice(0, 11), 36, S - 38);
    x.textAlign = "right"; x.fillText(`${(coin.grownLamports / 1e9).toFixed(2)} SOL`, S - 36, S - 38);
  } else if (special) {
    x.fillStyle = "#141518"; x.fillRect(0, 0, S, S);
    x.strokeStyle = "rgba(236,235,230,.22)"; x.lineWidth = 3; x.strokeRect(26, 26, S - 52, S - 52);
    x.fillStyle = "#ecebe6"; x.font = `600 80px ${SANS}`; x.fillText(special[0], S / 2, 236);
    x.fillStyle = "rgba(236,235,230,.55)"; x.font = `500 26px ${MONO}`; x.fillText(special[1].toUpperCase(), S / 2, 330);
  } else {
    x.fillStyle = PAPER; x.fillRect(0, 0, S, S);
    x.textAlign = "left"; x.fillStyle = "rgba(22,23,26,.38)"; x.font = `500 30px ${MONO}`;
    x.fillText(String(stop.id).padStart(2, "0"), 34, 50);
    x.strokeStyle = "rgba(22,23,26,.10)"; x.lineWidth = 2; x.setLineDash([10, 10]); x.strokeRect(70, 70, S - 140, S - 140);
  }
  return tex(c);
}

function coinFace(coin, img) {
  const S = 256, [c, x] = canvas(S);
  x.fillStyle = "#b8923a"; x.fillRect(0, 0, S, S);
  x.save(); x.beginPath(); x.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2); x.clip();
  if (img && img.complete && img.naturalWidth) {
    const k = Math.max(S * 0.8 / img.naturalWidth, S * 0.8 / img.naturalHeight);
    x.drawImage(img, S / 2 - (img.naturalWidth * k) / 2, S / 2 - (img.naturalHeight * k) / 2, img.naturalWidth * k, img.naturalHeight * k);
  } else { x.fillStyle = "#8c6c25"; x.fillRect(0, 0, S, S); x.fillStyle = "#f3e2b0"; x.font = `600 70px ${SANS}`; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(coin.symbol.slice(0, 3), S / 2, S / 2 + 4); }
  x.restore();
  return tex(c);
}

// ------------------------------------------------------------------ props
const FACE_VALUES = [3, 4, 1, 6, 2, 5]; // +x, -x, +y, -y, +z, -z (opposites sum to 7)
const TOP_ROT = { 1: [0, 0], 6: [Math.PI, 0], 2: [-Math.PI / 2, 0], 5: [Math.PI / 2, 0], 3: [0, Math.PI / 2], 4: [0, -Math.PI / 2] };
const PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };

function makeDie() {
  const s = 0.46, g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(s, s, s, 5, 0.07),
    new THREE.MeshPhysicalMaterial({ color: 0xf4f3ef, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.12 }));
  body.castShadow = true; body.receiveShadow = true; g.add(body);
  const pipGeo = new THREE.SphereGeometry(0.036, 16, 12), pipMat = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.4 });
  const red = new THREE.MeshStandardMaterial({ color: 0x9c2b2b, roughness: 0.4 });
  const axes = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  axes.forEach((n, fi) => {
    const v = FACE_VALUES[fi], nn = new THREE.Vector3(...n);
    const u = Math.abs(nn.y) > 0.5 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const w = new THREE.Vector3().crossVectors(nn, u);
    for (const [a, b] of PIPS[v]) {
      const p = new THREE.Mesh(pipGeo, v === 1 ? red : pipMat);
      p.position.copy(nn.clone().multiplyScalar(s / 2 - 0.012)).addScaledVector(u, a * 0.12).addScaledVector(w, b * 0.12);
      p.scale.set(1, 1, 1); p.lookAt(p.position.clone().add(nn)); p.scale.z = 0.35;
      g.add(p);
    }
  });
  return g;
}

function pawn(color, scale = 1, mine = false) {
  const grp = new THREE.Group();
  const metal = new THREE.MeshPhysicalMaterial({ color: mine ? 0xd8d8d6 : 0x3a3c40, metalness: 1, roughness: mine ? 0.18 : 0.32, clearcoat: 0.4 });
  const band = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 });
  const pts = [[0, 0], [0.15, 0], [0.155, 0.02], [0.14, 0.045], [0.09, 0.07], [0.06, 0.2], [0.045, 0.27], [0.085, 0.29], [0.085, 0.3], [0, 0.305]].map(([a, b]) => new THREE.Vector2(a, b));
  const body = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), metal); body.castShadow = true;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.078, 32, 24), metal); head.position.y = 0.37; head.castShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.105, 0.014, 12, 40), band); ring.rotation.x = Math.PI / 2; ring.position.y = 0.065;
  grp.add(body, head, ring);
  if (mine) {
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.225, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    halo.rotation.x = -Math.PI / 2; halo.position.y = 0.004; grp.add(halo); grp.userData.halo = halo;
  }
  grp.scale.setScalar(scale);
  return grp;
}

// Tilt-shift: blur grows away from a horizontal focus band (reads as a photographed scale model).
const TiltShift = {
  uniforms: { tDiffuse: { value: null }, amount: { value: 1.6 }, focus: { value: 0.5 }, band: { value: 0.28 }, res: { value: new THREE.Vector2(1, 1) } },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
  fragmentShader: `uniform sampler2D tDiffuse; uniform float amount, focus, band; uniform vec2 res; varying vec2 vUv;
    void main(){ float d = max(0.0, abs(vUv.y - focus) - band) / (1.0 - band); float r = amount * d * d * 6.0;
      vec4 s = vec4(0.0); float tot = 0.0;
      for (int i = -4; i <= 4; i++) { for (int j = -4; j <= 4; j++) { vec2 o = vec2(float(i), float(j)) * r / res; float w = 1.0 - length(vec2(i, j)) / 6.0; if (w > 0.0) { s += texture2D(tDiffuse, vUv + o) * w; tot += w; } } }
      gl_FragColor = s / tot; }`,
};

export class Board3D {
  constructor(container, { onSelect }) {
    this.container = container; this.onSelect = onSelect;
    this.tiles = new Map(); this.prints = new Map(); this.buildings = new Map(); this.coinMeshes = new Map(); this.imgs = new Map();
    this.others = []; this.me = null; this.myColor = null; this.myPos = null; this.sig = new Map();
    this.mobile = window.matchMedia("(max-width: 900px)").matches;
    this.hq = !this.mobile && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const w = container.clientWidth || 600, h = container.clientHeight || 600;
    const r = this.renderer = new THREE.WebGLRenderer({ antialias: !this.hq, alpha: true, powerPreference: "high-performance" });
    r.setPixelRatio(Math.min(this.hq ? 1.75 : 2, window.devicePixelRatio || 1)); r.setSize(w, h);
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.AgXToneMapping; r.toneMappingExposure = 1.1;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    container.append(r.domElement);
    r.domElement.setAttribute("aria-label", "TEK CITY 3D board"); r.domElement.setAttribute("role", "img");

    const scene = this.scene = new THREE.Scene();
    const pm = new THREE.PMREMGenerator(r);
    scene.environment = pm.fromScene(new RoomEnvironment(), 0.035).texture;
    scene.environmentIntensity = 0.55;
    scene.fog = new THREE.Fog(0x0c0d0f, 16, 34);
    const cam = this.camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 120);
    this.fit();

    // Lighting: one soft key light (window), cool low fill, warm bounce.
    scene.add(new THREE.HemisphereLight(0xdfe6ee, 0x2a1e16, 0.35));
    const key = this.key = new THREE.DirectionalLight(0xfff1e0, 2.6);
    key.position.set(-6, 11, 5); key.castShadow = true;
    key.shadow.mapSize.set(this.hq ? 4096 : 1536, this.hq ? 4096 : 1536);
    Object.assign(key.shadow.camera, { left: -6.5, right: 6.5, top: 6.5, bottom: -6.5, near: 1, far: 32 });
    key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4; scene.add(key);
    const fill = new THREE.DirectionalLight(0xc9d6e6, 0.35); fill.position.set(7, 5, -4); scene.add(fill);

    // Table + board
    const wood = walnut();
    const table = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.95 }));
    table.rotation.x = -Math.PI / 2; table.position.y = -0.42; table.receiveShadow = true; scene.add(table);
    const frame = new THREE.Mesh(new RoundedBoxGeometry(7.9, 0.4, 7.9, 6, 0.09),
      new THREE.MeshPhysicalMaterial({ map: wood.map, roughnessMap: wood.rough, roughness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.25 }));
    frame.position.y = -0.2; frame.castShadow = true; frame.receiveShadow = true; scene.add(frame);
    const inlay = new THREE.Mesh(new THREE.BoxGeometry(7.36, 0.02, 7.36), new THREE.MeshStandardMaterial({ color: 0x9a9da3, metalness: 1, roughness: 0.32 }));
    inlay.position.y = 0.001; inlay.receiveShadow = true; scene.add(inlay);
    const field = new THREE.Mesh(new THREE.BoxGeometry(7.3, 0.03, 7.3), new THREE.MeshStandardMaterial({ color: 0x141518, roughness: 0.8 }));
    field.position.y = 0.006; field.receiveShadow = true; scene.add(field);
    const center = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 4.9), new THREE.MeshStandardMaterial({ map: slate(), roughness: 0.75, metalness: 0.05 }));
    center.rotation.x = -Math.PI / 2; center.position.y = 0.023; center.receiveShadow = true; scene.add(center);

    // Community pool: a glass case on a steel plinth holding a stack of coins that grows with the pool.
    this.vault = new THREE.Group();
    const plinth = new THREE.Mesh(new RoundedBoxGeometry(1.25, 0.16, 1.25, 4, 0.03), new THREE.MeshStandardMaterial({ color: 0x8f9298, metalness: 1, roughness: 0.28 }));
    plinth.position.y = 0.1; plinth.castShadow = true; plinth.receiveShadow = true;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.0, 1.05), new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.05, ior: 1.45, transparent: true, opacity: 0.25, envMapIntensity: 1.2 }));
    glass.position.y = 0.68;
    this.coinStack = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.17, 0.17, 0.028, 40), new THREE.MeshStandardMaterial({ color: 0xc9a14a, metalness: 1, roughness: 0.25 }), 120);
    this.coinStack.castShadow = true; this.coinStack.count = 0;
    this.vault.add(plinth, glass, this.coinStack); this.vault.position.set(0, 0, 0.35); scene.add(this.vault);
    this.setVault(0);

    this.die = makeDie(); this.die.position.set(1.55, 0.26, 1.3); scene.add(this.die);
    this.setDie(1, false);

    this.crisis = new THREE.Mesh(new THREE.RingGeometry(0.44, 0.47, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }));
    this.crisis.rotation.x = -Math.PI / 2; this.crisis.visible = false; scene.add(this.crisis);

    // Post-processing (desktop): AO grounds every object, tilt-shift sells the scale model.
    if (this.hq) {
      try {
        const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
        const comp = this.composer = new EffectComposer(r, rt);
        comp.addPass(new RenderPass(scene, cam));
        const ao = new GTAOPass(scene, cam, w, h); ao.blendIntensity = 0.85;
        ao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.4, thickness: 1.2, scale: 1 });
        comp.addPass(ao); this.ao = ao;
        this.tilt = new ShaderPass(TiltShift); comp.addPass(this.tilt);
        comp.addPass(new OutputPass());
        this.resizePost(w, h);
      } catch { this.composer = null; }
    }

    this.controls = new OrbitControls(cam, r.domElement);
    Object.assign(this.controls, { enablePan: false, enableDamping: true, dampingFactor: 0.07, minDistance: 7, maxDistance: this.mobile ? 42 : 24, minPolarAngle: 0.2, maxPolarAngle: 1.2, rotateSpeed: 0.55, zoomSpeed: 0.7 });
    this.fit();
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

  resizePost(w, h) {
    if (!this.composer) return;
    const pr = this.renderer.getPixelRatio();
    this.composer.setPixelRatio(pr); this.composer.setSize(w, h);
    if (this.tilt) this.tilt.uniforms.res.value.set(w * pr, h * pr);
  }

  pick(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ptr.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(this.ptr, this.camera);
    const objs = [...this.tiles.values(), ...this.prints.values(), ...this.coinMeshes.values(), ...[...this.buildings.values()].flatMap((g) => g.children)];
    for (const h of this.ray.intersectObjects(objs, true)) { let o = h.object; while (o && o.userData.stop === undefined) o = o.parent; if (o) return o.userData.stop; }
    return null;
  }
  hover(id) {
    if (this.hoverId === id) return;
    const set = (k, y) => { for (const m of [this.tiles.get(k), this.prints.get(k)]) if (m) m.position.y = m.userData.y0 + y; };
    if (this.hoverId !== undefined && this.hoverId !== null) set(this.hoverId, 0);
    this.hoverId = id;
    if (id !== null) set(id, 0.04);
  }

  resize() {
    const w = this.container.clientWidth, h = this.container.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.resizePost(w, h);
    this.fit();
  }

  fit() {
    const cam = this.camera, a = cam.aspect || 1;
    const elev = (this.mobile ? 64 : 50) * Math.PI / 180;
    const vt = Math.tan((cam.fov * Math.PI) / 360), ht = vt * a;
    const d = Math.max((this.mobile && a < 1 ? 5.3 : 4.25) / ht, (this.mobile ? 3.25 : 3.6) / vt) + (this.mobile ? 1.6 : 0.9);
    const tz = this.mobile ? -0.1 : 0.2;
    cam.position.set(0, Math.sin(elev) * d, Math.cos(elev) * d + tz);
    cam.lookAt(0, 0, tz);
    if (this.controls) { this.controls.target.set(0, 0, tz); this.controls.update(); }
  }

  // ---------------------------------------------------------------- state
  update(city, me) {
    for (const s of city.stops) {
      const d = city.districts.find((x) => x.id === s.id);
      const hood = s.hood ? city.neighborhoods[s.hood] : null;
      const coin = (city.coins || []).find((c) => c.stop === s.id) || null;
      const img = coin && coin.image ? this.image(coin.image, s.id) : null;
      const sig = `|${coin ? `${coin.mint}:${coin.grownLamports}:${img && img.complete ? 1 : 0}` : "-"}`;
      if (this.sig.get(s.id) !== sig) { this.sig.set(s.id, sig); this.buildTile(s, d, hood, coin, img); }
    }
    const ev = city.event;
    if (ev && ev.kind === "crisis" && !(city.launchpad && city.launchpad.enabled)) { const p = worldOf(ev.target); this.crisis.position.set(p.x, TILE_H + 0.004, p.z); this.crisis.visible = true; }
    else this.crisis.visible = false;
    if (city.launchpad && city.launchpad.enabled) this.setVault(Math.min(1, (this.poolLamports || 0) / 20e9));
    else { const v = city.vault; this.setVault((v.progress - v.milestone * v.milestoneSize) / v.milestoneSize); }
    this.lastCity = city; this.lastMe = me;

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
        const t = pawn(this.colorFor(p.seed || p.name), 0.7);
        const a = (i / Math.min(6, ps.length)) * Math.PI * 2;
        t.position.set(c.x - 0.24 + Math.cos(a) * 0.12, TILE_H, c.z + 0.24 + Math.sin(a) * 0.08);
        this.scene.add(t); this.others.push(t);
      });
    }
    if (me.signedIn) {
      const col = this.colorFor(me.user.seed || me.user.name);
      if (!this.me || this.myColor !== col) { if (this.me) this.scene.remove(this.me); this.me = pawn(col, 1.25, true); this.myColor = col; this.scene.add(this.me); this.myPos = null; }
      if (this.myPos === null || (!this.moving && this.myPos !== me.position)) this.placeMe(me.position);
    } else if (this.me) { this.scene.remove(this.me); this.me = null; }
  }

  setPool(lamports) { this.poolLamports = Number(lamports) || 0; this.setVault(Math.min(1, this.poolLamports / 20e9)); }

  image(url, stopId) {
    let img = this.imgs.get(url);
    if (!img) {
      img = new Image(); img.decoding = "async";
      img.onload = () => { this.sig.delete(stopId); if (this.lastCity) this.update(this.lastCity, this.lastMe); };
      img.src = url; this.imgs.set(url, img);
    }
    return img;
  }

  colorFor(seed) {
    const palette = ["#c2410c", "#1d4ed8", "#15803d", "#a21caf", "#b45309", "#0e7490", "#be123c", "#4d7c0f"];
    let n = 0; for (const ch of String(seed || "x")) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
    return palette[n % palette.length];
  }

  spot(pos) { const c = worldOf(pos); return new THREE.Vector3(c.x + 0.2, TILE_H, c.z + 0.18); }
  placeMe(pos) { if (!this.me) return; this.myPos = pos; this.me.position.copy(this.spot(pos)); }

  buildTile(stop, district, hood, coin = null, img = null) {
    const p = worldOf(stop.id), size = CELL - GAP;
    for (const map of [this.tiles, this.prints]) { const o = map.get(stop.id); if (o) { this.scene.remove(o); if (o.material.map) o.material.map.dispose(); } }
    const dark = !!coin || !!SPECIAL[stop.type];
    const body = new THREE.Mesh(new RoundedBoxGeometry(size, TILE_H, size, 4, 0.025),
      new THREE.MeshPhysicalMaterial({ color: dark ? 0x17181b : 0xe9e7e1, roughness: dark ? 0.35 : 0.5, clearcoat: dark ? 0.7 : 0.25, clearcoatRoughness: 0.2 }));
    body.position.set(p.x, TILE_H / 2, p.z); body.userData = { stop: stop.id, y0: TILE_H / 2 };
    body.castShadow = true; body.receiveShadow = true;
    const print = new THREE.Mesh(new THREE.PlaneGeometry(size - 0.05, size - 0.05),
      new THREE.MeshPhysicalMaterial({ map: printTexture(stop, coin, img), roughness: dark ? 0.32 : 0.55, clearcoat: dark ? 0.6 : 0.2 }));
    print.rotation.x = -Math.PI / 2; print.position.set(p.x, TILE_H + 0.0015, p.z); print.userData = { stop: stop.id, y0: TILE_H + 0.0015 };
    print.receiveShadow = true;
    this.scene.add(body, print); this.tiles.set(stop.id, body); this.prints.set(stop.id, print);

    const oldB = this.buildings.get(stop.id); if (oldB) { this.scene.remove(oldB); this.buildings.delete(stop.id); }
    if (coin && !this.sig.has(`seen${stop.id}`)) {
      const animate = !!this.lastCity;
      this.sig.set(`seen${stop.id}`, 1);
      if (animate) this.tween(600, (k) => { const e = this.ease(k); print.position.y = print.userData.y0 + (1 - e) * 0.6; body.position.y = body.userData.y0 + (1 - e) * 0.6; });
    }
  }

  setVault(frac) {
    const f = Math.max(0, Math.min(1, frac || 0));
    const n = Math.round(4 + f * 110), m = new THREE.Matrix4(), r = rng(3);
    for (let i = 0; i < n; i++) {
      const col = i % 4, lvl = Math.floor(i / 4);
      const cx = (col % 2 ? 0.2 : -0.2), cz = (col < 2 ? -0.2 : 0.2);
      m.makeRotationY(r() * 6.28); m.setPosition(cx + (r() - 0.5) * 0.02, 0.194 + lvl * 0.03, cz + (r() - 0.5) * 0.02);
      this.coinStack.setMatrixAt(i, m);
    }
    this.coinStack.count = n; this.coinStack.instanceMatrix.needsUpdate = true;
  }

  setDie(value, animate = true) {
    const [rx, rz] = TOP_ROT[value] || [0, 0];
    if (!animate) { this.die.rotation.set(rx, 0, rz); return Promise.resolve(); }
    const start = this.die.rotation.clone();
    const spins = 2 + Math.floor(Math.random() * 2);
    const end = new THREE.Euler(rx + spins * Math.PI * 2, (Math.random() - 0.5) * 0.8, rz + spins * Math.PI * 2);
    const y0 = 0.26;
    return this.tween(1000, (k) => {
      const e = this.ease(k);
      this.die.rotation.set(start.x + (end.x - start.x) * e, start.y + (end.y - start.y) * e, start.z + (end.z - start.z) * e);
      this.die.position.y = y0 + Math.abs(Math.sin(k * Math.PI * 1.5)) * (1 - k) * 1.2;
    }).then(() => { this.die.rotation.set(rx, end.y, rz); this.die.position.y = y0; });
  }

  async move(path, roll) {
    this.moving = true;
    await this.setDie(roll, true);
    for (const id of path) {
      if (!this.me) break;
      const from = this.me.position.clone(), to = this.spot(id);
      await this.tween(230, (k) => { const e = this.ease(k); this.me.position.lerpVectors(from, to, e); this.me.position.y = TILE_H + Math.sin(k * Math.PI) * 0.3; });
      this.myPos = id;
    }
    this.moving = false;
  }

  ease(k) { return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  tween(ms, fn) { return new Promise((res) => this.anims.push({ t0: performance.now(), ms, fn, res })); }

  tick() {
    const now = performance.now(), t = this.clock.getElapsedTime();
    this.anims = this.anims.filter((a) => { const k = Math.min(1, (now - a.t0) / a.ms); a.fn(k); if (k >= 1) { a.res(); return false; } return true; });
    for (const [id, cm] of this.coinMeshes) cm.userData.disc.rotation.y = t * 0.9 + id;
    if (this.me && this.me.userData.halo) this.me.userData.halo.material.opacity = 0.45 + Math.sin(t * 2.4) * 0.25;
    if (this.crisis.visible) this.crisis.material.opacity = 0.35 + Math.sin(t * 3) * 0.25;
    if (this.controls.enabled) this.controls.update();
    if (this.composer) this.composer.render(); else this.renderer.render(this.scene, this.camera);
  }
}
