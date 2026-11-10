import { allowMethod, applyCors, type ApiRequest, type ApiResponse } from "./_lib";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!applyCors(req, res)) return;
  if (!allowMethod(req, res, "GET")) return;

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/models");
    if (!upstream.ok) return res.status(502).json({ error: "Model catalogue is unavailable." });

    const payload = await upstream.json() as { data?: Array<{ id: string; name?: string }> };
    const models = (payload.data || [])
      .filter((item) => typeof item.id === "string" && item.id.endsWith(":free"))
      .map((item) => ({ id: item.id, name: item.name || item.id }))
      .slice(0, 60);

    return res.status(200).json({ models });
  } catch {
    return res.status(502).json({ error: "Could not load free models." });
  }
}
