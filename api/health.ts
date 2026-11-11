interface HealthRequest {
  method?: string;
}

interface HealthResponse {
  status(code: number): this;
  setHeader(name: string, value: string): this;
  json(body: unknown): this;
  end(): this;
}

// Keep this diagnostic route independent from shared helpers so it can verify
// that the Vercel Node.js function runtime is starting correctly.
export default function handler(req: HealthRequest, res: HealthResponse) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  return res.status(200).json({
    ok: true,
    service: "AXIOMTECH AI API",
    runtime: "Vercel Functions",
    diagnostic: "standalone-health-v1",
  });
}
