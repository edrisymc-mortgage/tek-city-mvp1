"use strict";
// Builds static pages, bundles client JS (esbuild), copies CSS + self-hosted fonts into public/.
// Output is committed so production needs no build step.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const esbuild = require("esbuild");
const { PAGES } = require("../client/pages");

const ROOT = path.join(__dirname, "..");
const PUB = path.join(ROOT, "public");
const A = path.join(PUB, "assets");
for (const d of ["js", "css", "fonts", "img"]) fs.mkdirSync(path.join(A, d), { recursive: true });

(async () => {
  await esbuild.build({
    entryPoints: ["site", "landing", "rules", "play", "admin"].map((n) => path.join(ROOT, "client", `${n}.js`)),
    outdir: path.join(A, "js"), bundle: true, minify: true, format: "iife", target: ["es2020"], legalComments: "none",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  for (const f of ["base.css", "play.css"]) fs.copyFileSync(path.join(ROOT, "client", "css", f), path.join(A, "css", f));
  const fonts = {
    "fraunces-600.woff2": "@fontsource/fraunces/files/fraunces-latin-600-normal.woff2",
    "fraunces-800.woff2": "@fontsource/fraunces/files/fraunces-latin-800-normal.woff2",
    "plex-sans-400.woff2": "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2",
    "plex-sans-500.woff2": "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2",
    "plex-sans-600.woff2": "@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2",
    "plex-mono-500.woff2": "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2",
  };
  for (const [out, src] of Object.entries(fonts)) fs.copyFileSync(require.resolve(src), path.join(A, "fonts", out));
  fs.writeFileSync(path.join(A, "img", "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="1" y="1" width="30" height="30" rx="8" fill="#173d2d" stroke="#c9972b" stroke-width="1.5"/><path d="M8 23V14h4v9M14 23V8h4v15M20 23v-6h4v6" fill="#f4ecd8"/></svg>`);
  const v = crypto.createHash("sha256").update(fs.readdirSync(path.join(A, "js")).map((f) => fs.readFileSync(path.join(A, "js", f))).join("") + fs.readFileSync(path.join(A, "css", "play.css")) + fs.readFileSync(path.join(A, "css", "base.css"))).digest("hex").slice(0, 10);
  for (const [name, fn] of Object.entries(PAGES)) fs.writeFileSync(path.join(PUB, `${name}.html`), fn().replace(/__V__/g, v));
  console.log(`built ${Object.keys(PAGES).length} pages, assets v=${v}`);
})().catch((e) => { console.error(e); process.exit(1); });
