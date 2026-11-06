const { isStudioSession, readBody, json } = require("../../lib/studio-auth");
module.exports = async function handler(req, res) {
  if (req.method !== "POST") return json(res, 405, { error: "MÉTODO NÃO PERMITIDO." });
  if (!isStudioSession(req)) return json(res, 401, { error: "SESSÃO EXPIRADA. ENTRE NOVAMENTE NO STUDIO." });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return json(res, 503, { error: "OPENAI_API_KEY NÃO CONFIGURADA NA VERCEL." });
  if (!globalThis.__rocketStudioGenTimes) globalThis.__rocketStudioGenTimes = new Map();
  const sessionCookie = String(req.headers.cookie || "").split(";").map((part) => part.trim()).find((part) => part.startsWith("rocket_studio_session=")) || "session";
  const now = Date.now();
  const recent = (globalThis.__rocketStudioGenTimes.get(sessionCookie) || []).filter((time) => now - time < 60 * 60 * 1000);
  if (recent.length >= 8) return json(res, 429, { error: "LIMITE DE 8 GERAÇÕES POR HORA ATINGIDO. TENTE NOVAMENTE MAIS TARDE." });
  let body;
  try { body = readBody(req); } catch (_) { return json(res, 400, { error: "DADOS INVÁLIDOS." }); }
  const description = String(body.prompt || "").trim();
  const title = String(body.title || "").trim();
  const ages = ["2-4", "5-7", "8-11"];
  const difficulties = ["simple", "medium", "detailed"];
  if (!title || title.length > 70 || !description || description.length > 900 || !ages.includes(body.ageGroup) || !difficulties.includes(body.difficulty)) {
    return json(res, 400, { error: "REVISE O TÍTULO, A DESCRIÇÃO, A IDADE E A COMPLEXIDADE." });
  }
  const ageText = {
    "2-4": "for children aged 2–4: very large shapes, very few elements, bold simple closed outlines, generous white areas",
    "5-7": "for children aged 5–7: medium complexity, clear recognizable shapes, moderate detail and distinct closed regions",
    "8-11": "for children aged 8–11: richer detail and smaller regions, while keeping the composition clear and colorable"
  }[body.ageGroup];
  const complexity = {
    simple: "Use a simple composition with large separate closed color areas.",
    medium: "Use balanced detail with several distinct closed fill areas and a clear composition.",
    detailed: "Use rich line-art detail and many distinct closed color areas without clutter."
  }[body.difficulty];
  const prompt = [
    "Create a print-quality black-and-white coloring-book illustration for the Estação Rocket children's activity app.",
    "Scene: " + description,
    "Age guidance: " + ageText + ".",
    "Complexity: " + complexity,
    "Category: " + String(body.category || "ESPAÇO").slice(0, 40) + ".",
    "STRICT COLORING PAGE RULES: pure white background; crisp solid black outlines; consistent line weight; closed, clearly separated shapes suitable for flood-fill bucket coloring; no gray, gradients, hatching, shadows, crosshatching, color, large filled black areas, text, letters, numbers, logos, watermark, page mockup or frame.",
    "COMPOSITION: one complete centered scene, nothing cropped, generous margin around full drawing, friendly expressive characters, visually clear to a child, square canvas.",
    "The final output must be only black line art on white."
  ].join(" ");
  try {
    recent.push(now);
    globalThis.__rocketStudioGenTimes.set(sessionCookie, recent);
    const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2.6-sunburst";
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Authorization": "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt, size: "1024x1024", quality: "high", output_format: "png", n: 1 })
    });
    const result = await response.json();
    if (!response.ok) {
      const message = result.error && result.error.message ? result.error.message : "A API DE IMAGENS NÃO CONSEGUIU GERAR A ILUSTRAÇÃO.";
      return json(res, response.status >= 400 && response.status < 500 ? 422 : 502, { error: message });
    }
    const b64 = result.data && result.data[0] && result.data[0].b64_json;
    if (!b64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(b64)) return json(res, 502, { error: "A API NÃO RETORNOU UMA IMAGEM VÁLIDA." });
    return json(res, 200, { dataUrl: "data:image/png;base64," + b64, model });
  } catch (_) {
    return json(res, 502, { error: "FALHA AO CONECTAR À API DE IMAGENS. TENTE NOVAMENTE." });
  }
};