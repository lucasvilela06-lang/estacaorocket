const { json } = require("../../lib/studio-auth");
const { isStudioSession } = require("../../lib/studio-auth");
module.exports = async function handler(req, res) {
  if (req.method !== "GET") return json(res, 405, { error: "MÉTODO NÃO PERMITIDO." });
  const authenticated = isStudioSession(req);
  return json(res, 200, {
    authenticated,
    capabilities: authenticated ? {
      generate: Boolean(process.env.OPENAI_API_KEY),
      publish: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    } : {}
  });
};