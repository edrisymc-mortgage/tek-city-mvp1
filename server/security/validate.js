"use strict";
// Minimal strict validator: unknown keys are rejected, types and ranges enforced.
const { fail } = require("./util");

const UUIDISH = /^[A-Za-z0-9_-]{8,64}$/;
const NAME = /^[A-Za-z0-9][A-Za-z0-9 _.-]{1,19}$/;

function obj(body, shape) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) fail(400, "bad_request", "Request body must be a JSON object.");
  for (const k of Object.keys(body)) if (!(k in shape)) fail(400, "bad_request", `Unexpected field: ${String(k).slice(0, 30)}`);
  const out = {};
  for (const [k, rule] of Object.entries(shape)) {
    const v = body[k];
    if (v === undefined || v === null || v === "") {
      if (rule.optional) continue;
      fail(400, "bad_request", `Missing field: ${k}`);
    }
    out[k] = check(k, v, rule);
  }
  return out;
}

function check(k, v, r) {
  switch (r.type) {
    case "int": {
      if (typeof v !== "number" || !Number.isInteger(v)) fail(400, "bad_request", `${k} must be an integer.`);
      if (r.min !== undefined && v < r.min) fail(400, "bad_request", `${k} must be at least ${r.min}.`);
      if (r.max !== undefined && v > r.max) fail(400, "bad_request", `${k} must be at most ${r.max}.`);
      return v;
    }
    case "bool":
      if (typeof v !== "boolean") fail(400, "bad_request", `${k} must be true or false.`);
      return v;
    case "string": {
      if (typeof v !== "string") fail(400, "bad_request", `${k} must be text.`);
      const s = r.trim === false ? v : v.trim();
      if (r.min && s.length < r.min) fail(400, "bad_request", `${k} is too short.`);
      if (r.max && s.length > r.max) fail(400, "bad_request", `${k} is too long.`);
      if (r.pattern && !r.pattern.test(s)) fail(400, "bad_request", `${k} has an invalid format.`);
      // strip control characters
      return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
    }
    case "enum":
      if (!r.values.includes(v)) fail(400, "bad_request", `${k} is not a valid option.`);
      return v;
    default:
      fail(500, "server_error", "Validation misconfigured.");
  }
}

function idempotencyKey(req) {
  const k = req.get("Idempotency-Key");
  if (!k || !UUIDISH.test(k)) fail(400, "idempotency_required", "Missing or invalid Idempotency-Key header.");
  return k;
}

module.exports = { obj, idempotencyKey, NAME, UUIDISH };
