import assert from "node:assert/strict";
import test from "node:test";
import { spawn } from "node:child_process";

function runImportProbe() {
  const probe = `
    import http from "node:http";
    let listenCalls = 0;
    const originalListen = http.Server.prototype.listen;
    http.Server.prototype.listen = function (...args) {
      listenCalls += 1;
      return originalListen.apply(this, args);
    };
    await import("./api/[...path].js");
    await new Promise((resolve) => setImmediate(resolve));
    const servers = process._getActiveHandles().filter((handle) => handle?.constructor?.name === "Server");
    console.log(JSON.stringify({ listenCalls, openServers: servers.length }));
  `;

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--input-type=module", "--eval", probe], {
      cwd: process.cwd(),
      env: { ...process.env, NODE_ENV: "test" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Import probe did not exit naturally; an open handle may remain."));
    }, 5000);
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", reject);
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`Import probe failed (${code}): ${stderr}`));
      resolve(JSON.parse(stdout.trim().split(/\r?\n/).at(-1)));
    });
  });
}

test("importing the Vercel API creates no listener and leaves no server handle", async () => {
  const result = await runImportProbe();
  assert.deepEqual(result, { listenCalls: 0, openServers: 0 });
});
