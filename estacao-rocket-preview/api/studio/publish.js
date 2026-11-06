const { isStudioSession, readBody, json } = require("../../lib/studio-auth");
const crypto = require("crypto");
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "MÉTODO NÃO PERMITIDO." });
  if (!isStudioSession(req)) return json(res, 401, { error: "SESSÃO EXPIRADA. ENTRE NOVAMENTE NO STUDIO." });
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json(res, 503, { error: "SUPABASE_URL E SUPABASE_SERVICE_ROLE_KEY AINDA NÃO ESTÃO CONFIGURADAS." });
  let item;
  try { item = readBody(req); } catch (_) { return json(res, 400, { error: "DADOS INVÁLIDOS." }); }
  const title = String(item.title || "").trim();
  const dataUrl = String(item.dataUrl || "");
  if (!title || title.length > 70 || !dataUrl.startsWith("data:image/png;base64,")) return json(res, 400, { error: "A ILUSTRAÇÃO PRECISA SER UM PNG VÁLIDO E TER UM TÍTULO." });
  const b64 = dataUrl.slice("data:image/png;base64,".length);
  if (b64.length > 16000000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return json(res, 413, { error: "ARQUIVO PNG INVÁLIDO OU MUITO GRANDE." });
  const bytes = Buffer.from(b64, "base64");
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return json(res, 400, { error: "O ARQUIVO NÃO É UM PNG VÁLIDO." });
  const id = crypto.randomUUID();
  const filePath = "studio/" + id + ".png";
  try {
    const upload = await fetch(url + "/storage/v1/object/rocket-coloring/" + filePath, {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "apikey": key, "Content-Type": "image/png", "x-upsert": "true", "Cache-Control": "public, max-age=31536000" },
      body: bytes
    });
    if (!upload.ok) {
      const detail = await upload.text();
      return json(res, 502, { error: "FALHA AO ENVIAR PARA O STORAGE: " + detail.slice(0, 220) });
    }
    const metadata = {
      id, title, description: String(item.prompt || "").slice(0, 1000),
      age_groups: [String(item.ageGroup || "5-7")],
      difficulty: String(item.difficulty || "medium"),
      category: String(item.category || "ESPAÇO").slice(0, 50),
      file_path: filePath, width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20),
      published: true
    };
    const save = await fetch(url + "/rest/v1/coloring_artworks", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "apikey": key, "Content-Type": "application/json", "Prefer": "return=representation" },
      body: JSON.stringify(metadata)
    });
    const savedText = await save.text();
    if (!save.ok) return json(res, 502, { error: "ARQUIVO ENVIADO, MAS FALHOU AO SALVAR O CATÁLOGO: " + savedText.slice(0, 220) });
    return json(res, 200, { published: true, id, publicUrl: url + "/storage/v1/object/public/rocket-coloring/" + filePath });
  } catch (_) {
    return json(res, 502, { error: "NÃO FOI POSSÍVEL CONCLUIR A PUBLICAÇÃO. VERIFIQUE O SUPABASE." });
  }
};