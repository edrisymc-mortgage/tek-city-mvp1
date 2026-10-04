"use strict";
const helmet = require("helmet");
const crypto = require("crypto");
const { UserError } = require("./util");

function securityHeaders(config) {
  const wsOrigins = [...config.allowedOrigins].map((o) => o.replace(/^http/, "ws"));
  return helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'"],
        "font-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "connect-src": ["'self'", ...wsOrigins],
        "frame-ancestors": ["'none'"],
        "form-action": ["'self'"],
        "base-uri": ["'none'"],
        "object-src": ["'none'"],
        "manifest-src": ["'self'"],
        ...(config.isProd ? { "upgrade-insecure-requests": [] } : {}),
      },
    },
    strictTransportSecurity: config.isProd ? { maxAge: 31536000, includeSubDomains: true } : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  });
}

function permissionsPolicy(_req, res, next) {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()");
  next();
}

function httpsOnly(config) {
  return (req, res, next) => {
    if (!config.isProd || req.secure || req.path === "/health") return next();
    if (req.method === "GET" || req.method === "HEAD") return res.redirect(308, `https://${req.get("host")}${req.originalUrl}`);
    return res.status(403).json({ error: { code: "https_required", message: "HTTPS is required." } });
  };
}

// Strict CORS: only allowlisted origins get CORS headers; API requests from other origins are rejected.
function cors(config) {
  return (req, res, next) => {
    const origin = req.get("Origin");
    if (!origin) return next();
    if (!config.allowedOrigins.has(origin)) {
      if (req.path.startsWith("/api/")) return res.status(403).json({ error: { code: "bad_origin", message: "Origin not allowed." } });
      return next();
    }
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Vary", "Origin");
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Methods", "GET, POST");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-CSRF-Token, Idempotency-Key");
      res.setHeader("Access-Control-Max-Age", "600");
      return res.sendStatus(204);
    }
    next();
  };
}

function noStoreApi(req, res, next) {
  if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
  next();
}

// Never leak stack traces, SQL, or internal messages.
function errorHandler(config) {
  // eslint-disable-next-line no-unused-vars
  return (err, req, res, _next) => {
    if (err instanceof UserError) {
      return res.status(err.status).json({ error: { code: err.code, message: err.message, ...(err.extra || {}) } });
    }
    if (err && err.type === "entity.parse.failed") return res.status(400).json({ error: { code: "bad_json", message: "Malformed JSON." } });
    if (err && err.type === "entity.too.large") return res.status(413).json({ error: { code: "too_large", message: "Request too large." } });
    const id = crypto.randomBytes(6).toString("hex");
    console.error(`[error ${id}] ${req.method} ${req.path}: ${err && (err.code || "")} ${err && err.message ? String(err.message).slice(0, 200) : err}`);
    if (!config.isProd && err && err.stack && !config.isTest) console.error(err.stack);
    res.status(500).json({ error: { code: "server_error", message: `Something went wrong on our side. Reference ${id}.` } });
  };
}

module.exports = { securityHeaders, permissionsPolicy, httpsOnly, cors, noStoreApi, errorHandler };
