// Thin API client. The server owns all game state; this only sends intents and reads results.
let csrf = null;

export class ApiError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}

function newKey() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
}

async function request(method, path, body, headers = {}) {
  const res = await fetch(path, {
    method,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(csrf ? { "X-CSRF-Token": csrf } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (data && data.csrf) csrf = data.csrf;
  if (!res.ok) {
    const e = (data && data.error) || {};
    throw new ApiError(res.status, e.code || "error", e.message || "Something went wrong. Please try again.");
  }
  return data;
}

export const api = {
  async session() { const d = await request("GET", "/api/session"); csrf = d.csrf; return d; },
  get: (p) => request("GET", p),
  post: (p, b) => request("POST", p, b || {}),
  // Game actions carry an Idempotency-Key so a retried request can never apply twice.
  async action(type, body = {}, key = newKey()) {
    try { return await request("POST", `/api/action/${type}`, body, { "Idempotency-Key": key }); }
    catch (e) {
      if (!(e instanceof ApiError) || e.status >= 502) return request("POST", `/api/action/${type}`, body, { "Idempotency-Key": key });
      if (e.code === "csrf" || e.code === "no_session") { await api.session(); return request("POST", `/api/action/${type}`, body, { "Idempotency-Key": key }); }
      throw e;
    }
  },
};
