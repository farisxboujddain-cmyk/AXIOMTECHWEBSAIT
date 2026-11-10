import {
  allowMethod, applyCors, getApiKey, getConfiguredOrigin, isFreeModel, isRateLimited,
  readJsonBody, requireApiKey, type ApiRequest, type ApiResponse,
} from "./_lib.js";

type Message = { role: "user" | "assistant"; content: string };

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!applyCors(req, res)) return;
  if (!allowMethod(req, res, "POST")) return;
  if (isRateLimited(req)) return res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });
  if (!requireApiKey(res)) return;

  const body = readJsonBody(req, 64 * 1024);
  if (!body) return res.status(400).json({ error: "Invalid or oversized request body." });

  const model = body.model ?? "openrouter/free";
  const messages = body.messages;

  if (!isFreeModel(model)) {
    return res.status(400).json({ error: "Only free model routes are enabled." });
  }
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20 ||
    messages.some((message) => {
      if (!message || typeof message !== "object") return true;
      const item = message as Record<string, unknown>;
      return !["user", "assistant"].includes(String(item.role)) ||
        typeof item.content !== "string" || item.content.length > 8_000;
    }) ||
    messages.reduce((total, message) => total + (message as Message).content.length, 0) > 24_000
  ) {
    return res.status(400).json({ error: "Invalid conversation. Send up to 20 messages, each under 8,000 characters and 24,000 characters total." });
  }

  try {
    const origin = getConfiguredOrigin();
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + getApiKey(),
        "Content-Type": "application/json",
        "HTTP-Referer": origin,
        "X-Title": "AXIOMTECH AI Hub",
      },
      body: JSON.stringify({ model, messages, max_tokens: 900 }),
    });
    const result = await upstream.json() as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!upstream.ok) {
      return res.status(upstream.status === 429 ? 429 : 502)
        .json({ error: result.error?.message || "The selected model is temporarily unavailable." });
    }

    const reply = result.choices?.[0]?.message?.content;
    if (typeof reply !== "string") return res.status(502).json({ error: "The model returned an empty response." });
    return res.status(200).json({ reply });
  } catch {
    return res.status(502).json({ error: "The AI provider connection failed. Please try again." });
  }
}
