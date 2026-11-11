declare const process: { env: Record<string, string | undefined> };

export interface ApiRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
}

export interface ApiResponse {
  status(code: number): this;
  setHeader(name: string, value: string): this;
  json(body: unknown): this;
  end(): this;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function headerValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export function getConfiguredOrigin(): string {
  return process.env.ALLOWED_ORIGIN || "";
}

export function applyCors(req: ApiRequest, res: ApiResponse): boolean {
  const allowedOrigin = getConfiguredOrigin();
  const requestOrigin = headerValue(req.headers.origin);
  const requestHost = headerValue(req.headers.host);
  const isSameOrigin = Boolean(requestHost) &&
    (requestOrigin === "https://" + requestHost || requestOrigin === "http://" + requestHost);
  if (requestOrigin && requestOrigin !== allowedOrigin && !isSameOrigin) {
    res.status(403).setHeader("Vary", "Origin").json({ error: "Origin not allowed." });
    return false;
  }
  if (requestOrigin) res.setHeader("Access-Control-Allow-Origin", isSameOrigin ? requestOrigin : allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Vary", "Origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return false;
  }
  return true;
}

export function allowMethod(req: ApiRequest, res: ApiResponse, method: string): boolean {
  if (req.method === method) return true;
  res.status(405).json({ error: "Method not allowed." });
  return false;
}

export function isRateLimited(req: ApiRequest): boolean {
  const forwarded = headerValue(req.headers["x-forwarded-for"]);
  const ip = forwarded.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const current = requestCounts.get(ip);
  if (!current || current.resetAt <= now) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (requestCounts.size > 5_000) {
      for (const [key, value] of requestCounts) if (value.resetAt <= now) requestCounts.delete(key);
    }
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

export function readJsonBody(req: ApiRequest, maxBytes: number): Record<string, unknown> | null {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) return null;
  try {
    if (new TextEncoder().encode(JSON.stringify(req.body)).byteLength > maxBytes) return null;
    return req.body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function requireApiKey(res: ApiResponse): boolean {
  if (process.env.NVIDIA_API_KEY) return true;
  res.status(503).json({ error: "NVIDIA NIM is not configured for this deployment." });
  return false;
}
