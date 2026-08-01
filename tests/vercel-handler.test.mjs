import assert from "node:assert/strict";
import test from "node:test";

process.env.VERCEL = "1";
process.env.NODE_ENV = "test";
const { default: handler, normalizeVercelApiUrl } = await import("../api/[...path].js");
const { default: projectHandler } = await import("../api/projects/[id].js");
const { default: bridgeHandler } = await import("../api/_bridge.js");

function responseRecorder() {
  return {
    status: 0, headers: {}, body: "",
    writeHead(status, headers = {}) { this.status = status; this.headers = headers; },
    end(chunk = "") { this.body += chunk; },
    write(chunk = "") { this.body += chunk; return true; },
  };
}

function vercelRequest(pathname, method = "GET", search = "") {
  const path = pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  return {
    url: `${pathname}${search}`,
    query: { path },
    method,
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
  };
}

function contentType(response) {
  const entry = Object.entries(response.headers).find(([key]) => key.toLowerCase() === "content-type");
  return entry?.[1] || "";
}

const productionShapes = [
  ["/api/health", ["health"], "/api/health"],
  ["/api/data", ["data"], "/api/data"],
  ["/api/visits", ["visits"], "/api/visits"],
  ["/api/auth/status", ["auth", "status"], "/api/auth/status"],
];

for (const [url, path, expected] of productionShapes) {
  test(`normalizes Vercel request shape ${url}`, () => {
    assert.equal(normalizeVercelApiUrl({ url, query: { path } }), expected);
  });
}

test("normalizes an internal catch-all URL once and preserves query parameters", () => {
  const request = { url: "/api/[...path]?includeDrafts=1&view=grid", query: { path: ["projects"] } };
  assert.equal(normalizeVercelApiUrl(request), "/api/projects?includeDrafts=1&view=grid");
});

test("Vercel /api/health returns JSON 200", async () => {
  const request = vercelRequest("/api/health");
  const response = responseRecorder();
  await handler(request, response);
  assert.equal(response.status, 200);
  assert.match(contentType(response), /^application\/json/i);
  const body = JSON.parse(response.body);
  assert.equal(body.ok, true);
  assert.equal(body.service, "portfolio-backend");
});

test("Vercel /api/data returns JSON 200", async () => {
  const request = vercelRequest("/api/data");
  const response = responseRecorder();
  await handler(request, response);
  assert.equal(response.status, 200);
  assert.match(contentType(response), /^application\/json/i);
  const body = JSON.parse(response.body);
  assert.ok(Array.isArray(body.projects));
});

test("Vercel unknown API route returns JSON 404", async () => {
  const request = vercelRequest("/api/nonexistent");
  const response = responseRecorder();
  await handler(request, response);
  assert.equal(response.status, 404);
  assert.match(contentType(response), /^application\/json/i);
  assert.deepEqual(JSON.parse(response.body), { message: "Not found." });
});

test("Vercel function rejects non-API paths with JSON", async () => {
  const request = { url: "/not-api", query: {}, method: "GET", headers: {}, socket: {} };
  const response = responseRecorder();
  await handler(request, response);
  assert.equal(response.status, 404);
  assert.match(contentType(response), /^application\/json/i);
});
test("explicit project bridge routes DELETE /api/projects/p_test to application auth", async () => {
  const request = vercelRequest("/api/projects/p_test", "DELETE");
  request.headers.authorization = "Bearer invalid-test-token";
  const response = responseRecorder();
  await projectHandler(request, response);
  assert.equal(response.status, 401);
  assert.match(contentType(response), /^application\/json/i);
  assert.deepEqual(JSON.parse(response.body), { message: "Unauthorized." });
});

test("explicit project bridge routes PATCH /api/projects/p_test to application auth", async () => {
  const request = vercelRequest("/api/projects/p_test", "PATCH");
  request.headers.authorization = "Bearer invalid-test-token";
  const response = responseRecorder();
  await projectHandler(request, response);
  assert.equal(response.status, 401);
  assert.match(contentType(response), /^application\/json/i);
});

test("explicit project bridge routes GET /api/projects/p_test to application JSON 404", async () => {
  const request = vercelRequest("/api/projects/p_test");
  const response = responseRecorder();
  await projectHandler(request, response);
  assert.equal(response.status, 404);
  assert.match(contentType(response), /^application\/json/i);
  assert.deepEqual(JSON.parse(response.body), { message: "Not found." });
});

test("universal bridge sends unknown nested APIs to application JSON 404", async () => {
  const request = {
    url: "/api/_bridge?source=vercel",
    query: { path: "unknown/deep/path" },
    method: "GET",
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
  };
  const response = responseRecorder();
  await bridgeHandler(request, response);
  assert.equal(request.url, "/api/unknown/deep/path?source=vercel");
  assert.equal(response.status, 404);
  assert.match(contentType(response), /^application\/json/i);
});
