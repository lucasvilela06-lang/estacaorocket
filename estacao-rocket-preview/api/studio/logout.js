module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end(JSON.stringify({ error: "MÉTODO NÃO PERMITIDO." }));
  }
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Set-Cookie", "rocket_studio_session=; Path=/api/studio; HttpOnly; Secure; SameSite=Strict; Max-Age=0");
  res.end(JSON.stringify({ ok: true }));
};