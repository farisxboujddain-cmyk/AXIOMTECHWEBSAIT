import { allowMethod, applyCors, type ApiRequest, type ApiResponse } from "./_lib";

export default function handler(req: ApiRequest, res: ApiResponse) {
  // Allow direct browser checks with no Origin header; enforce CORS for browser app requests.
  if (req.headers.origin) {
    if (!applyCors(req, res)) return;
  } else {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
  }
  if (!allowMethod(req, res, "GET")) return;
  return res.status(200).json({ ok: true, service: "AXIOMTECH AI API", runtime: "Vercel Functions" });
}
