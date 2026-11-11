import { allowMethod, applyCors, requireApiKey, type ApiRequest, type ApiResponse } from "./_lib.js";
import { nimRequest } from "./_nim.js";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!applyCors(req, res)) return;
  if (!allowMethod(req, res, "GET")) return;
  if (!requireApiKey(res)) return;

  try {
    const upstream = await nimRequest("models", undefined, 15_000);
    if (!upstream.ok) {
      console.error("[AXIOMTECH Models] NVIDIA catalogue returned:", upstream.status);
      return res.status(upstream.status === 429 ? 429 : 502).json({
        error: upstream.status === 429 ? "NVIDIA model catalogue is rate limited. Try again shortly." : "NVIDIA model catalogue is unavailable.",
      });
    }
    const payload = await upstream.json() as { data?: Array<{ id?: string; name?: string }> };
    const models = (payload.data || [])
      .filter(item => typeof item.id === "string" && /^[a-zA-Z0-9][a-zA-Z0-9._/-]{1,180}$/.test(item.id))
      .map(item => ({ id: item.id as string, name: item.name || item.id as string }))
      .slice(0, 80);
    if (models.length === 0) return res.status(502).json({ error: "NVIDIA returned no available models for this API key." });
    return res.status(200).json({ models });
  } catch (error) {
    console.error("[AXIOMTECH Models] NVIDIA catalogue request failed:", error instanceof Error ? error.message : String(error));
    return res.status(502).json({ error: "Could not load NVIDIA NIM models. Check the API key and try again." });
  }
}
