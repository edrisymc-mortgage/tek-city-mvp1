"use strict";
// Boots the real app against an embedded Postgres, with a tiny cookie-aware HTTP client.
const crypto = require("crypto");
const nacl = require("tweetnacl");
const { load } = require("../server/config");
const { createApp } = require("../server/app");
const { b58encode } = require("../server/auth/address");

async function boot(env = {}) {
  const config = load({ NODE_ENV: "test", PORT: "0", SESSION_SECRET: "t".repeat(48), ...env });
  const t = await createApp(config, { noScheduler: true });
  await new Promise((r) => t.server.listen(0, "127.0.0.1", r));
  const port = t.server.address().port;
  const base = `http://127.0.0.1:${port}`;
  config.allowedOrigins.add(base);
  config.appUrl = base;
  // every test client shares 127.0.0.1, so lift the per-IP guest caps
  global.__TEKCITY_RATE_OVERRIDES = { guest_create: { max: 100000 } };
  await require("../server/db/pool").query(`UPDATE app_settings SET value = '100000'::jsonb WHERE key = 'max_guest_accounts_per_ip_per_day'`);
  return { ...t, config, base, client: () => new Client(base) };
}

class Client {
  constructor(base) { this.base = base; this.cookies = {}; this.csrf = null; this.n = 0; }
  cookieHeader() { return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join("; "); }
  store(res) {
    const set = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    for (const c of set) {
      const [kv, ...attrs] = c.split(";");
      const [k, v] = kv.split("=");
      if (attrs.some((a) => /max-age=0/i.test(a)) || v === "") delete this.cookies[k.trim()];
      else this.cookies[k.trim()] = v;
    }
  }
  async req(method, path, body, headers = {}) {
    const res = await fetch(this.base + path, {
      method,
      headers: {
        "content-type": "application/json", origin: this.base,
        ...(this.csrf ? { "x-csrf-token": this.csrf } : {}),
        ...(Object.keys(this.cookies).length ? { cookie: this.cookieHeader() } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : typeof body === "string" ? body : JSON.stringify(body),
    });
    this.store(res);
    let json = null;
    try { json = await res.json(); } catch { /* not json */ }
    if (json && json.csrf) this.csrf = json.csrf;
    return { status: res.status, body: json, headers: res.headers };
  }
  get(p) { return this.req("GET", p); }
  post(p, b, h) { return this.req("POST", p, b, h); }
  async start() { return this.get("/api/session"); }
  async guest(name = "Tester") { await this.start(); return this.post("/api/guest", { name }); }
  action(type, body = {}, key) { return this.post(`/api/action/${type}`, body, { "idempotency-key": key || `k-${type}-${crypto.randomBytes(6).toString("hex")}` }); }
}

function wallet() {
  const kp = nacl.sign.keyPair();
  return {
    address: b58encode(kp.publicKey), kp,
    sign: (msg) => Buffer.from(nacl.sign.detached(new TextEncoder().encode(msg), kp.secretKey)).toString("base64"),
  };
}

async function walletLogin(client, w) {
  if (!client.csrf) await client.start();
  const n = await client.post("/api/auth/nonce", { address: w.address });
  return client.post("/api/auth/verify", { address: w.address, nonce: n.body.nonce, signature: w.sign(n.body.message) });
}

module.exports = { boot, Client, wallet, walletLogin };
