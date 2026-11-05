export interface Env {
  OPENROUTER_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

type Message = { role: 'user' | 'assistant'; content: string };

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 10;
const MAX_BODY_BYTES = 64 * 1024;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

function json(body: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
      'Vary': 'Origin',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const current = requestCounts.get(ip);
  if (!current || current.resetAt <= now) {
    requestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    // Keep this best-effort in-memory map bounded inside each Worker isolate.
    if (requestCounts.size > 5_000) {
      for (const [key, value] of requestCounts) {
        if (value.resetAt <= now) requestCounts.delete(key);
      }
    }
    return false;
  }
  current.count += 1;
  return current.count > MAX_REQUESTS_PER_WINDOW;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const configuredOrigin = env.ALLOWED_ORIGIN;
    const requestOrigin = request.headers.get('Origin') || '';
    if (!configuredOrigin) return json({ error: 'API origin is not configured.' }, 503, 'null');

    // Browser API access is restricted to the configured site. This is not a
    // substitute for Cloudflare's edge rate-limiting rules against scripted clients.
    if (requestOrigin !== configuredOrigin) {
      return json({ error: 'Origin not allowed.' }, 403, configuredOrigin);
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': configuredOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
          'Vary': 'Origin',
        },
      });
    }

    const url = new URL(request.url);
    if (url.pathname === '/api/health' && request.method === 'GET') {
      return json({ ok: true, service: 'AXIOMTECH AI API' }, 200, configuredOrigin);
    }

    if (url.pathname === '/api/models' && request.method === 'GET') {
      try {
        const upstream = await fetch('https://openrouter.ai/api/v1/models');
        if (!upstream.ok) return json({ error: 'Model catalogue is unavailable.' }, 502, configuredOrigin);
        const payload = await upstream.json() as {
          data?: Array<{ id: string; name?: string }>;
        };
        const models = (payload.data || [])
          .filter((item) => typeof item.id === 'string' && item.id.endsWith(':free'))
          .map((item) => ({ id: item.id, name: item.name || item.id }))
          .slice(0, 60);
        return json({ models }, 200, configuredOrigin);
      } catch {
        return json({ error: 'Could not load free models.' }, 502, configuredOrigin);
      }
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (isRateLimited(ip)) {
        return json({ error: 'Too many requests. Please wait a minute and try again.' }, 429, configuredOrigin);
      }
      if (!env.OPENROUTER_API_KEY) return json({ error: 'AI provider key is not configured.' }, 503, configuredOrigin);

      const contentLength = Number(request.headers.get('Content-Length') || 0);
      if (contentLength > MAX_BODY_BYTES) {
        return json({ error: 'Request is too large.' }, 413, configuredOrigin);
      }

      try {
        const rawBody = await request.text();
        if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
          return json({ error: 'Request is too large.' }, 413, configuredOrigin);
        }
        const body = JSON.parse(rawBody) as { model?: string; messages?: Message[] };
        const model = body.model || 'openrouter/free';
        const messages = body.messages;

        if (typeof model !== 'string' || !(model === 'openrouter/free' || model.endsWith(':free'))) {
          return json({ error: 'Only free model routes are enabled.' }, 400, configuredOrigin);
        }
        if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20 ||
          messages.some((message) =>
            !message || !['user', 'assistant'].includes(message.role) ||
            typeof message.content !== 'string' || message.content.length > 8_000
          ) ||
          messages.reduce((total, message) => total + message.content.length, 0) > 24_000
        ) {
          return json({ error: 'Invalid conversation. Send up to 20 messages, each under 8,000 characters and 24,000 characters total.' }, 400, configuredOrigin);
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + env.OPENROUTER_API_KEY,
            'Content-Type': 'application/json',
            'HTTP-Referer': configuredOrigin,
            'X-Title': 'AXIOMTECH AI Hub',
          },
          body: JSON.stringify({ model, messages, max_tokens: 900 }),
        });
        const result = await response.json() as {
          choices?: Array<{ message?: { content?: string } }>;
          error?: { message?: string };
        };
        if (!response.ok) {
          return json({ error: result.error?.message || 'The selected model is temporarily unavailable.' }, response.status === 429 ? 429 : 502, configuredOrigin);
        }
        const reply = result.choices?.[0]?.message?.content;
        if (typeof reply !== 'string') return json({ error: 'The model returned an empty response.' }, 502, configuredOrigin);
        return json({ reply }, 200, configuredOrigin);
      } catch {
        return json({ error: 'Invalid request or provider connection failed.' }, 400, configuredOrigin);
      }
    }

    return json({ error: 'Not found.' }, 404, configuredOrigin);
  },
};
