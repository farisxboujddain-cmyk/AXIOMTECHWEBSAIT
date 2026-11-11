const NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1";

declare const process: { env: Record<string, string | undefined> };

export type NimMessage = { role: "system" | "user" | "assistant"; content: string };

export function getNvidiaKey(): string {
  return process.env.NVIDIA_API_KEY || "";
}

export function isNimModel(value: unknown): value is string {
  return typeof value === "string" &&
    /^[a-zA-Z0-9][a-zA-Z0-9._/-]{1,180}$/.test(value) &&
    !value.includes("..");
}

export async function nimRequest(
  path: "chat/completions" | "models",
  body?: Record<string, unknown>,
  timeoutMs = 45_000,
): Promise<Response> {
  const key = getNvidiaKey();
  if (!key) throw new Error("NVIDIA_API_KEY is not configured for this deployment.");
  return fetch(NVIDIA_BASE_URL + "/" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(timeoutMs),
  });
}

export async function nimChat(
  model: string,
  messages: NimMessage[],
  maxTokens = 1200,
  timeoutMs = 45_000,
): Promise<string> {
  const response = await nimRequest("chat/completions", {
    model,
    messages,
    temperature: 0.2,
    max_tokens: maxTokens,
    stream: false,
  }, timeoutMs);

  const payload = await response.json() as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>;
    error?: { message?: string } | string;
  };

  if (!response.ok) {
    const detail = typeof payload.error === "string"
      ? payload.error
      : payload.error?.message;
    if (response.status === 401 || response.status === 403) {
      throw new Error("NVIDIA rejected the API key. Check NVIDIA_API_KEY in Vercel Preview.");
    }
    if (response.status === 429) {
      throw new Error("NVIDIA NIM rate limit reached. Wait a little and try again.");
    }
    throw new Error(detail || "NVIDIA NIM is temporarily unavailable.");
  }

  const content = payload.choices?.[0]?.message?.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(part => part.text || "").join("\n");
  throw new Error("NVIDIA NIM returned an empty response.");
}
