import {
  allowMethod, applyCors, isRateLimited, readJsonBody, requireApiKey,
  type ApiRequest, type ApiResponse,
} from "./_lib.js";
import { isNimModel, nimChat } from "./_nim.js";

type Message = { role: "user" | "assistant"; content: string };
const DEFAULT_CHAT_MODEL = "nvidia/llama-3.1-nemotron-70b-instruct";

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (!applyCors(req, res)) return;
  if (!allowMethod(req, res, "POST")) return;
  if (isRateLimited(req)) return res.status(429).json({ error: "Too many requests. Please wait a minute and try again." });
  if (!requireApiKey(res)) return;

  const body = readJsonBody(req, 64 * 1024);
  if (!body) return res.status(400).json({ error: "Invalid or oversized request body." });
  const model = body.model ?? DEFAULT_CHAT_MODEL;
  const messages = body.messages;

  if (!isNimModel(model)) return res.status(400).json({ error: "Choose a valid NVIDIA NIM model." });
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20 ||
    messages.some(message => {
      if (!message || typeof message !== "object") return true;
      const item = message as Record<string, unknown>;
      return !["user", "assistant"].includes(String(item.role)) ||
        typeof item.content !== "string" || item.content.length > 8_000;
    }) ||
    messages.reduce((total, message) => total + (message as Message).content.length, 0) > 24_000
  ) return res.status(400).json({ error: "Invalid conversation. Send up to 20 messages, each under 8,000 characters and 24,000 characters total." });

  try {
    const reply = await nimChat(model, messages as Message[], 900, 45_000);
    return res.status(200).json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "NVIDIA NIM request failed.";
    const status = /rate limit/i.test(message) ? 429 : /API key/i.test(message) ? 503 : 502;
    console.error("[AXIOMTECH Chat] NVIDIA NIM request failed:", message);
    return res.status(status).json({ error: message });
  }
}
