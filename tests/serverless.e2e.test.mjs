import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const dataDir = await mkdtemp(path.join(os.tmpdir(), "portfolio-serverless-"));
const sharedEnv = { ...process.env, NODE_ENV: "test", ADMIN_USERNAME: "serverless-admin", ADMIN_PASSWORD: "ServerlessPassword123!", ADMIN_SESSION_SECRET: "serverless-test-secret-that-is-longer-than-32-characters", PORTFOLIO_DATA_DIR: dataDir, SMTP_TEST_MODE: "true" };
const servers = [];

async function start(port) {
  const child = spawn(process.execPath, ["server/index.js"], { cwd: process.cwd(), env: { ...sharedEnv, PORT: String(port) }, stdio: "ignore" });
  servers.push(child);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await fetch(`http://127.0.0.1:${port}/api/health`)).ok) return; } catch { /* retry */ }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Server ${port} did not start.`);
}

test("stateless admin token survives a different serverless instance", async () => {
  await start(3221);
  const login = await fetch("http://127.0.0.1:3221/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "serverless-admin", password: "ServerlessPassword123!" }) });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);

  await start(3222);
  const session = await fetch("http://127.0.0.1:3222/api/session", { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(session.status, 200);
  assert.equal((await session.json()).authenticated, true);

  const signedUpload = await fetch("http://127.0.0.1:3222/api/uploads/sign", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ name: "test.png", type: "image/png", size: 100 }) });
  assert.equal(signedUpload.status, 503);
});

test.after(async () => {
  servers.forEach((server) => server.kill("SIGTERM"));
  await rm(dataDir, { recursive: true, force: true });
});
