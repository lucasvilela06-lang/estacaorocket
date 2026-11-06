module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  if (req.method !== "GET") { res.statusCode = 405; return res.end(JSON.stringify({ error: "MÉTODO NÃO PERMITIDO." })); }
  const url = String(process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) { res.statusCode = 200; return res.end(JSON.stringify({ artworks: [] })); }
  try {
    const response = await fetch(url + "/rest/v1/coloring_artworks?select=id,title,description,age_groups,difficulty,category,file_path,width,height&published=eq.true&order=created_at.desc", {
      headers: { "Authorization": "Bearer " + key, "apikey": key }
    });
    const data = await response.json();
    if (!response.ok) throw new Error("CATÁLOGO INDISPONÍVEL");
    const artworks = (Array.isArray(data) ? data : []).map((item) => ({
      id: item.id, title: item.title, detail: item.description || "",
      ages: item.age_groups || [], difficulty: item.difficulty || "medium",
      category: item.category || "ESPAÇO",
      src: url + "/storage/v1/object/public/rocket-coloring/" + item.file_path,
      width: item.width, height: item.height
    }));
    return res.end(JSON.stringify({ artworks }));
  } catch (_) {
    return res.end(JSON.stringify({ artworks: [] }));
  }
};