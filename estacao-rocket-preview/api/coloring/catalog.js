const { json, getSupabaseConfig, supabaseHeaders } = require("../../lib/studio-auth");
module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  if (req.method !== "GET") return json(res, 405, { error: "MÉTODO NÃO PERMITIDO." });
  const { url, key } = getSupabaseConfig();
  if (!url || !key) return json(res, 200, { artworks: [] });
  try {
    const response = await fetch(url + "/rest/v1/coloring_artworks?select=id,title,description,age_groups,difficulty,category,file_path,width,height&published=eq.true&order=created_at.desc", {
      headers: supabaseHeaders(key)
    });
    const data = await response.json();
    if (!response.ok) throw new Error("CATÁLOGO INDISPONÍVEL");
    const artworks = (Array.isArray(data) ? data : []).map((item) => ({
      id: item.id, title: item.title, detail: item.description || "",
      ages: item.age_groups || [], difficulty: item.difficulty || "medium",
      category: item.category || "ESPAÇO",
      src: "/api/coloring/image?id=" + encodeURIComponent(item.id),
      width: item.width, height: item.height
    }));
    return json(res, 200, { artworks });
  } catch (_) {
    return json(res, 200, { artworks: [] });
  }
};