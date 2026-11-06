const crypto = require("crypto");
const COOKIE = "rocket_studio_session";
const MAX_AGE = 60 * 60 * 8;
function isStudioSession(req) {
  const secret = process.env.ROCKET_STUDIO_SESSION_SECRET;
  if (!secret) return false;
  const entry = String(req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(COOKIE + "="));
  if (!entry) return false;
  const parts = entry.slice(COOKIE.length + 1).split(".");
  if (parts.length !== 2 || !/^[0-9]+$/.test(parts[0])) return false;
  const issued = Number(parts[0]);
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(issued) || issued > now + 60 || now - issued > MAX_AGE) return false;
  const expected = crypto.createHmac("sha256", secret).update(parts[0]).digest();
  let actual;
  try { actual = Buffer.from(parts[1], "hex"); } catch (_) { return false; }
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function readBody(req) {
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  return req.body || {};
}
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}
module.exports = { isStudioSession, readBody, json };