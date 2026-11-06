const crypto = require("crypto");
const COOKIE = "rocket_studio_session";
const MAX_AGE = 60 * 60 * 8;
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end(JSON.stringify({ error: "MÉTODO NÃO PERMITIDO." }));
  }
  const password = process.env.ROCKET_STUDIO_PASSWORD;
  const secret = process.env.ROCKET_STUDIO_SESSION_SECRET;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (!password) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: "FALTA CONFIGURAR ROCKET_STUDIO_PASSWORD NAS VARIÁVEIS DE AMBIENTE DO PROJETO VERCEL, NO AMBIENTE PRODUCTION." }));
  }
  if (!secret) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: "FALTA CONFIGURAR ROCKET_STUDIO_SESSION_SECRET NAS VARIÁVEIS DE AMBIENTE DO PROJETO VERCEL, NO AMBIENTE PRODUCTION." }));
  }
  if (secret.length < 32) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: "ROCKET_STUDIO_SESSION_SECRET ESTÁ CONFIGURADA, MAS TEM MENOS DE 32 CARACTERES. GERE OUTRA COM: openssl rand -hex 32" }));
  }
  let submitted = "";
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    submitted = String(body.password || "");
  } catch (_) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: "SOLICITAÇÃO INVÁLIDA." }));
  }
  const expected = Buffer.from(password);
  const actual = Buffer.from(submitted);
  const valid = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
  if (!valid) {
    res.statusCode = 401;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ error: "SENHA INCORRETA. TENTE NOVAMENTE." }));
  }
  const issued = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", secret).update(issued).digest("hex");
  res.setHeader("Set-Cookie", COOKIE + "=" + issued + "." + signature + "; Path=/api/studio; HttpOnly; Secure; SameSite=Strict; Max-Age=" + MAX_AGE);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify({ authenticated: true }));
};