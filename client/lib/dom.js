// Tiny DOM builder. Text is always set via textContent (no HTML injection). Styles go through CSSOM (CSP-safe).
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") el.className = v;
    else if (k === "style") for (const [sk, sv] of Object.entries(v)) el.style.setProperty(sk, sv);
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "text") el.textContent = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
export const icon = (name) => h("i", { "data-lucide": name });
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
export function avatarColor(seed) {
  const palette = ["#e2b33c", "#c9972b", "#8fb6dd", "#9fd8b2", "#f2a99e", "#d9cba6", "#b8d0e8", "#f3d68f"];
  let n = 0; for (const ch of String(seed || "x")) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[n % palette.length];
}
export function avatar(name, seed, cls = "") {
  return h("span", { class: `avatar ${cls}`, style: { background: avatarColor(seed || name) }, title: name }, (name || "?").slice(0, 2).toUpperCase());
}
export function fmtTime(iso) { const d = new Date(iso); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; }
