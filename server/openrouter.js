export const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

export class OpenRouterError extends Error {
  constructor(status, message, details = {}) {
    super(message || "OpenRouter request failed.");
    this.name = "OpenRouterError";
    this.status = Number(status) || 502;
    this.code = details.code ?? this.status;
    this.errorType = details.errorType || "";
  }
}

function providerError(status, payload = {}) {
  const source = payload?.error || payload;
  return new OpenRouterError(source?.code || status, source?.message, {
    code: source?.code || status,
    errorType: source?.metadata?.error_type,
  });
}

export async function requestOpenRouterChat({ apiKey, model, messages, stream, maxTokens, signal, siteUrl = "", fetchImpl = fetch }) {
  if (!apiKey) throw new OpenRouterError(503, "AI_API_KEY is not configured.", { code: "missing_api_key" });
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "X-OpenRouter-Title": "Erudita Portfolio Assistant",
  };
  if (siteUrl) headers["HTTP-Referer"] = siteUrl;
  const response = await fetchImpl(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model, messages, stream, max_tokens: maxTokens }),
    signal,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw providerError(response.status, payload);
  }
  return response;
}

export async function consumeOpenRouterStream(response, onDelta) {
  const reader = response.body?.getReader();
  if (!reader) throw new OpenRouterError(502, "OpenRouter streaming is unavailable.");
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";
  const consumeLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const data = trimmed.replace(/^data:\s*/, "");
    if (!data || data === "[DONE]") return;
    const payload = JSON.parse(data);
    if (payload?.error) throw providerError(payload.error.code || 502, payload);
    const delta = payload?.choices?.[0]?.delta?.content || "";
    if (delta) { fullText += delta; onDelta(delta); }
  };
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() || "";
    lines.forEach(consumeLine);
  }
  buffer += decoder.decode();
  if (buffer.trim()) consumeLine(buffer);
  return fullText;
}

export function friendlyOpenRouterError(error) {
  const status = Number(error?.status || error?.code);
  const message = String(error?.message || "");
  if (error?.name === "AbortError" || /abort|timeout|timed out/i.test(message) || status === 504) return "The assistant took too long to respond. Please try again.";
  if (status === 401 || status === 403 || /api key|auth|permission/i.test(message)) return "The assistant's secure AI connection is not configured correctly. You can still ask about projects, skills, services, availability, or contact details.";
  if (status === 402 || /quota|billing|credit|insufficient/i.test(message)) return "The AI provider has no available credits right now. You can still ask about projects, skills, services, availability, or contact details.";
  if (status === 429) return "The free AI models are at their rate limit right now. Please try again shortly, or ask a portfolio question that I can answer locally.";
  if ([404, 502, 503].includes(status) || /no endpoints|model.*unavailable|provider.*unavailable|overloaded/i.test(message)) return "No free AI model is available right now. Please try again shortly, or ask about projects, skills, services, availability, or contact details.";
  return "The AI service is temporarily unavailable. Please try again, or ask a portfolio question that I can answer locally.";
}
