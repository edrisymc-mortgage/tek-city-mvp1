"use strict";
const crypto = require("crypto");

let SECRET = crypto.randomBytes(32);
function setSecret(s) { SECRET = Buffer.from(String(s)); }

// Keyed hashes: we never store raw IPs, user agents, or session tokens.
const hmac = (value, label = "") => crypto.createHmac("sha256", SECRET).update(`${label}:${value}`).digest("hex");
const ipHash = (req) => hmac(req.ip || (req.socket && req.socket.remoteAddress) || "unknown", "ip").slice(0, 32);
const uaHash = (req) => hmac(String(req.headers["user-agent"] || "").slice(0, 300), "ua").slice(0, 32);
const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString("base64url");

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ""));
  const y = Buffer.from(String(b || ""));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

// Errors safe to show users. Everything else becomes a generic message.
class UserError extends Error {
  constructor(status, code, message, extra) { super(message); this.status = status; this.code = code; this.extra = extra; }
}
const fail = (status, code, message, extra) => { throw new UserError(status, code, message, extra); };

module.exports = { setSecret, hmac, ipHash, uaHash, randomToken, safeEqual, UserError, fail };
