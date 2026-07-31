import test from "node:test";
import assert from "node:assert/strict";
import { consumeOpenRouterStream, friendlyOpenRouterError, requestOpenRouterChat } from "../server/openrouter.js";

const messages = [{ role: "user", content: "Hello" }];
const jsonResponse = (status, body) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

test("valid OpenRouter request uses secure provider config and optional headers", async () => {
  let request;
  const response = await requestOpenRouterChat({
    apiKey: "server-secret", model: "openrouter/free", messages, stream: false, maxTokens: 120,
    siteUrl: "https://portfolio.example", fetchImpl: async (url, options) => { request = { url, options }; return jsonResponse(200, { choices: [{ message: { content: "Hello" } }] }); },
  });
  assert.equal(response.status, 200);
  assert.equal(request.url, "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(request.options.headers.Authorization, "Bearer server-secret");
  assert.equal(request.options.headers["HTTP-Referer"], "https://portfolio.example");
  assert.equal(request.options.headers["X-OpenRouter-Title"], "Erudita Portfolio Assistant");
  assert.deepEqual(JSON.parse(request.options.body), { model: "openrouter/free", messages, stream: false, max_tokens: 120 });
});

test("streaming combines chunks and forwards each delta", async () => {
  const encoder = new TextEncoder();
  const response = new Response(new ReadableStream({ start(controller) {
    controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"Hello "}}]}\n\n'));
    controller.enqueue(encoder.encode('data: {"choices":[{"delta":{"content":"world"}}]}\n\ndata: [DONE]\n\n'));
    controller.close();
  }}));
  const chunks = [];
  assert.equal(await consumeOpenRouterStream(response, (chunk) => chunks.push(chunk)), "Hello world");
  assert.deepEqual(chunks, ["Hello ", "world"]);
});

test("missing API key is rejected before any browser-visible request", async () => {
  await assert.rejects(() => requestOpenRouterChat({ apiKey: "", model: "openrouter/free", messages, fetchImpl: async () => assert.fail() }), { status: 503, code: "missing_api_key" });
});

for (const [name, status, expected] of [
  ["invalid key", 401, /secure AI connection/i],
  ["insufficient credits", 402, /no available credits/i],
  ["free-model rate limit", 429, /rate limit/i],
  ["unavailable free models", 503, /No free AI model/i],
]) {
  test(name, async () => {
    let caught;
    try { await requestOpenRouterChat({ apiKey: "bad", model: "openrouter/free", messages, fetchImpl: async () => jsonResponse(status, { error: { code: status, message: name } }) }); } catch (error) { caught = error; }
    assert.equal(caught.status, status);
    assert.match(friendlyOpenRouterError(caught), expected);
  });
}

test("timeout has a helpful response", () => {
  const error = new Error("This operation was aborted"); error.name = "AbortError";
  assert.match(friendlyOpenRouterError(error), /too long/i);
});

test("stream-level OpenRouter errors are detected", async () => {
  const body = 'data: {"error":{"code":429,"message":"rate limited"}}\n\n';
  await assert.rejects(() => consumeOpenRouterStream(new Response(body), () => {}), { status: 429 });
});
