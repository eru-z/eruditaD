import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import "dotenv/config";

const port = 3198;
const origin = `http://127.0.0.1:${port}`;
let server;
let dataDir;

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { const response = await fetch(`${origin}/api/health`); if (response.ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Chatbot test server did not start.");
}

async function streamChat(message) {
  const response = await fetch(`${origin}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: message }], message }),
  });
  return { response, text: await response.text() };
}

test.before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "portfolio-chat-e2e-"));
  server = spawn(process.execPath, ["server/index.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), PORTFOLIO_DATA_DIR: dataDir, NODE_ENV: "test", CHATBOT_DEV_MOCK_RESPONSES: "false", SUPABASE_URL: "", SUPABASE_SERVICE_ROLE_KEY: "" },
    stdio: "ignore",
  });
  await waitForServer();
});

test.after(async () => {
  server?.kill();
  if (dataDir) await rm(dataDir, { recursive: true, force: true });
});

test("health exposes provider status without exposing credentials", async () => {
  const response = await fetch(`${origin}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.assistant.provider, "openrouter");
  assert.equal(body.assistant.streaming, true);
  assert.equal(JSON.stringify(body).includes(process.env.AI_API_KEY || "__never__"), false);
});

test("local portfolio fallback works through the public streaming route", async () => {
  const { response, text } = await streamChat("How can I contact Erudita?");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/plain/);
  assert.ok(text.trim().length > 20);
  assert.match(text, /contact|email|reach/i);
  assert.equal(response.headers.get("x-assistant-source"), "local");
});

test("live OpenRouter response streams through the secure backend route", { skip: !String(process.env.AI_API_KEY || "").trim() }, async () => {
  const { response, text } = await streamChat("In one short sentence, describe Erudita's professional focus.");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") || "", /text\/plain/);
  assert.equal(response.headers.get("x-assistant-source"), "openrouter");
  assert.ok(text.trim().length > 10, `Expected a streamed answer, received: ${text}`);
  assert.doesNotMatch(text, /not configured|temporarily unavailable|rate limit|No free AI model/i);
});
