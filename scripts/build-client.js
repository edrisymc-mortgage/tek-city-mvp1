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
    "geist-400.woff2": "@fontsource/geist-sans/files/geist-sans-latin-400-normal.woff2",
    "geist-500.woff2": "@fontsource/geist-sans/files/geist-sans-latin-500-normal.woff2",
    "geist-600.woff2": "@fontsource/geist-sans/files/geist-sans-latin-600-normal.woff2",
    "geist-700.woff2": "@fontsource/geist-sans/files/geist-sans-latin-700-normal.woff2",
    "geist-mono-400.woff2": "@fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2",
    "geist-mono-500.woff2": "@fontsource/geist-mono/files/geist-mono-latin-500-normal.woff2",
  };
  for (const [out, src] of Object.entries(fonts)) fs.copyFileSync(require.resolve(src), path.join(A, "fonts", out));
  fs.writeFileSync(path.join(A, "img", "favicon.svg"), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0b0c0e"/><g fill="#ededeb">${[0,1,2,3,4].flatMap((i)=>[0,1,2,3,4].filter((j)=>i%4===0||j%4===0).map((j)=>`<rect x="${4+i*5}" y="${4+j*5}" width="4" height="4" rx="1"/>`)).join("")}</g></svg>`);
  const IMG = path.join(ROOT, "client", "img");
  if (fs.existsSync(IMG)) for (const f of fs.readdirSync(IMG)) fs.copyFileSync(path.join(IMG, f), path.join(A, "img", f));
  const v = crypto.createHash("sha256").update(fs.readdirSync(path.join(A, "js")).map((f) => fs.readFileSync(path.join(A, "js", f))).join("") + fs.readFileSync(path.join(A, "css", "play.css")) + fs.readFileSync(path.join(A, "css", "base.css"))).digest("hex").slice(0, 10);
  for (const [name, fn] of Object.entries(PAGES)) fs.writeFileSync(path.join(PUB, `${name}.html`), fn().replace(/__V__/g, v));
  console.log(`built ${Object.keys(PAGES).length} pages, assets v=${v}`);
})().catch((e) => { console.error(e); process.exit(1); });
