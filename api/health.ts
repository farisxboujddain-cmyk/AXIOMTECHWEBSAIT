import { allowMethod, applyCors, type ApiRequest, type ApiResponse } from "./_lib";

export default function handler(req: ApiRequest, res: ApiResponse) {
  if (!applyCors(req, res)) return;
  if (!allowMethod(req, res, "GET")) return;
  return res.status(200).json({ ok: true, service: "AXIOMTECH AI API", runtime: "Vercel Functions" });
}
