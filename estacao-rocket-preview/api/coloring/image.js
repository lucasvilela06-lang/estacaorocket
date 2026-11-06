const { json, getSupabaseConfig, supabaseHeaders } = require("../../lib/studio-auth");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "MÉTODO NÃO PERMITIDO." });

  const { url, key } = getSupabaseConfig();
  if (!url || !key) return json(res, 503, { error: "BIBLIOTECA DE IMAGENS NÃO CONFIGURADA." });

  let id = "";
  try {
    const requestUrl = new URL(req.url, "https://estacaorocket.vercel.app");
    id = String((req.query && req.query.id) || requestUrl.searchParams.get("id") || "");
  } catch (_) {
    return json(res, 400, { error: "IDENTIFICADOR DA ILUSTRAÇÃO INVÁLIDO." });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return json(res, 400, { error: "IDENTIFICADOR DA ILUSTRAÇÃO INVÁLIDO." });
  }

  try {
    const lookupUrl = url + "/rest/v1/coloring_artworks?select=id,file_path&published=eq.true&id=eq." + encodeURIComponent(id) + "&limit=1";
    const lookup = await fetch(lookupUrl, { headers: supabaseHeaders(key) });
    if (!lookup.ok) return json(res, 502, { error: "NÃO FOI POSSÍVEL CONSULTAR A BIBLIOTECA DE ILUSTRAÇÕES." });
    const records = await lookup.json();
    const record = Array.isArray(records) ? records[0] : null;
    if (!record || record.file_path !== "studio/" + id + ".png") {
      return json(res, 404, { error: "ILUSTRAÇÃO NÃO ENCONTRADA OU NÃO PUBLICADA." });
    }

    const imageResponse = await fetch(url + "/storage/v1/object/public/rocket-coloring/" + record.file_path, {
      headers: supabaseHeaders(key)
    });
    if (!imageResponse.ok) return json(res, 502, { error: "NÃO FOI POSSÍVEL BAIXAR A ILUSTRAÇÃO DO ARMAZENAMENTO." });

    const bytes = Buffer.from(await imageResponse.arrayBuffer());
    if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
      return json(res, 502, { error: "O ARQUIVO PUBLICADO NÃO É UM PNG VÁLIDO." });
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Length", String(bytes.length));
    res.setHeader("Content-Disposition", 'inline; filename="rocket-coloring.png"');
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "public, s-maxage=1800, stale-while-revalidate=86400");
    return res.end(bytes);
  } catch (_) {
    return json(res, 502, { error: "FALHA AO PREPARAR A ILUSTRAÇÃO PARA O EDITOR." });
  }
};