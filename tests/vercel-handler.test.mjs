import assert from "node:assert/strict";
import test from "node:test";

process.env.VERCEL = "1";
process.env.NODE_ENV = "test";
const { default: handler } = await import("../api/[...path].js");

function responseRecorder() {
  return {
    status: 0, headers: {}, body: "",
    writeHead(status, headers = {}) { this.status = status; this.headers = headers; },
    end(chunk = "") { this.body += chunk; },
    write(chunk = "") { this.body += chunk; return true; },
  };
}

test("Vercel catch-all function serves API health without starting a listener", async () => {
  const request = { url: "/api/health", method: "GET", headers: {}, socket: { remoteAddress: "127.0.0.1" } };
  const response = responseRecorder();
  await handler(request, response);
  assert.equal(response.status, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.ok, true);
  assert.equal(body.service, "portfolio-backend");
});

test("Vercel function rejects non-API paths", async () => {
  const request = { url: "/not-api", method: "GET", headers: {}, socket: {} };
  const response = responseRecorder();
  await handler(request, response);
  assert.equal(response.status, 404);
});
