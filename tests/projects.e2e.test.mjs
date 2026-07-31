import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const port = 3197;
const origin = `http://127.0.0.1:${port}`;
let server;
let dataDir;
let token;

async function request(pathname, options = {}) {
  const response = await fetch(`${origin}${pathname}`, options);
  const body = await response.json().catch(() => ({}));
  if (!response.ok && response.status >= 500) console.error("E2E API failure", pathname, response.status, body);
  return { response, body };
}

async function authed(pathname, options = {}) {
  return request(pathname, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) } });
}

test.before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "portfolio-projects-e2e-"));
  server = spawn(process.execPath, ["server/start.js"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      PORTFOLIO_DATA_DIR: dataDir,
      NODE_ENV: "test",
      ADMIN_USERNAME: "testadmin",
      ADMIN_PASSWORD: "TestPassword!123",
      SUPABASE_URL: "",
      SUPABASE_SERVICE_ROLE_KEY: "",
      SMTP_TEST_MODE: "true",
    },
    stdio: "ignore",
  });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try { if ((await request("/api/health")).response.ok) break; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  const login = await request("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: "testadmin", password: "TestPassword!123" }) });
  assert.equal(login.response.status, 200);
  token = login.body.token;
});

test.after(async () => {
  server?.kill();
  if (dataDir) await rm(dataDir, { recursive: true, force: true });
});

test("project CRUD, publish state, saved ordering and featured limit persist", async () => {
  const unauthorized = await request("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(unauthorized.response.status, 401);

  const initial = await authed("/api/projects?includeDrafts=1");
  assert.equal(initial.response.status, 200);
  for (const project of initial.body.projects.filter((item) => item.featured)) {
    const unfeatured = await authed(`/api/projects/${encodeURIComponent(project.id)}`, { method: "PATCH", body: JSON.stringify({ featured: false }) });
    assert.equal(unfeatured.response.status, 200, JSON.stringify(unfeatured.body));
  }

  const createdIds = [];
  for (let index = 1; index <= 4; index += 1) {
    const id = `e2e-project-${index}`;
    const created = await authed("/api/projects", { method: "POST", body: JSON.stringify({ id, title: `E2E Project ${index}`, category: "Web", description: "Production flow test", year: 2026, status: index === 1 ? "Draft" : "Published", tags: ["React", "API"] }) });
    assert.equal(created.response.status, 201);
    createdIds.push(id);
  }

  const publicDraft = await request("/api/projects");
  assert.equal(publicDraft.body.projects.some((item) => item.id === createdIds[0]), false);
  const published = await authed(`/api/projects/${createdIds[0]}`, { method: "PATCH", body: JSON.stringify({ status: "Published", title: "Updated E2E Project" }) });
  assert.equal(published.response.status, 200);
  assert.equal(published.body.project.title, "Updated E2E Project");

  for (const id of createdIds.slice(0, 3)) {
    const featured = await authed(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify({ featured: true }) });
    assert.equal(featured.response.status, 200);
  }
  const fourth = await authed(`/api/projects/${createdIds[3]}`, { method: "PATCH", body: JSON.stringify({ featured: true }) });
  assert.equal(fourth.response.status, 409);
  assert.match(fourth.body.message, /Only 3 projects can be featured/i);

  const all = await authed("/api/projects?includeDrafts=1");
  const reorderedIds = [...all.body.projects.map((item) => item.id)];
  const selected = reorderedIds.filter((id) => createdIds.includes(id));
  const rest = reorderedIds.filter((id) => !createdIds.includes(id));
  const desired = [...selected.reverse(), ...rest];
  const reordered = await authed("/api/projects/order", { method: "PUT", body: JSON.stringify({ ids: desired }) });
  assert.equal(reordered.response.status, 200);
  assert.deepEqual(reordered.body.projects.slice(0, 4).map((item) => item.id), desired.slice(0, 4));

  const persisted = await request("/api/data");
  assert.deepEqual(persisted.body.projects.slice(0, 4).map((item) => item.id), desired.slice(0, 4));
  assert.equal(persisted.body.projects.filter((item) => item.featured).length, 3);

  const deleted = await authed(`/api/projects/${createdIds[3]}`, { method: "DELETE" });
  assert.equal(deleted.response.status, 200);
  const afterDelete = await authed("/api/projects?includeDrafts=1");
  assert.equal(afterDelete.body.projects.some((item) => item.id === createdIds[3]), false);
});

test("achievement and certificate CRUD data validates and preserves saved order", async () => {
  const state = (await request("/api/data")).body;
  const achievements = {
    ...(state.achievements || {}),
    recognitions: [
      { id: "a-2", title: "Second", subtitle: "Place", description: "Two", year: "2026", tags: "React, AI", published: true },
      { id: "a-1", title: "First", subtitle: "Winner", description: "One", year: "2025", tags: ["Web"], published: true },
    ],
    certificates: [
      { id: "c-2", title: "Certificate Two", issuer: "Issuer", image: "/images/certificates/spring-code-fest.jpg", published: true },
      { id: "c-1", title: "Certificate One", issuer: "Issuer", image: "/images/certificates/science-fair.jpg", published: true },
    ],
  };
  const saved = await authed("/api/data", { method: "PUT", body: JSON.stringify({ ...state, achievements }) });
  assert.equal(saved.response.status, 200, JSON.stringify(saved.body));
  assert.deepEqual(saved.body.achievements.recognitions.map((item) => item.id), ["a-2", "a-1"]);
  assert.deepEqual(saved.body.achievements.recognitions[0].tags, ["React", "AI"]);
  assert.deepEqual(saved.body.achievements.certificates.map((item) => item.id), ["c-2", "c-1"]);
});

test("skills with uploaded logos, categories and saved order update shared live data", async () => {
  const state = (await request("/api/data")).body;
  const skills = [
    { id: "skill-react", name: "React.js", group: "Frontend", logo: "https://cdn.simpleicons.org/react/61DAFB", level: 95, published: true },
    { id: "skill-css", name: "CSS", group: "Frontend", logo: "/images/ez-logo-blue.png", level: 90, published: true },
    { id: "skill-node", name: "Node.js", group: "Backend", logo: "https://cdn.simpleicons.org/nodedotjs/5FA04E", level: 88, published: false },
  ];
  const saved = await authed("/api/data", { method: "PUT", body: JSON.stringify({ ...state, skills }) });
  assert.equal(saved.response.status, 200);
  assert.deepEqual(saved.body.skills.map((skill) => skill.id), ["skill-react", "skill-css", "skill-node"]);
  assert.equal(saved.body.skills[0].group, "Frontend");
  assert.equal(saved.body.skills[0].logo, "https://cdn.simpleicons.org/react/61DAFB");
  assert.equal(saved.body.skills[2].published, false);
  const persisted = await request("/api/data");
  assert.deepEqual(persisted.body.skills.map((skill) => skill.name), ["React.js", "CSS", "Node.js"]);
});
test("contact submissions reach protected admin inbox and visits reach analytics", async () => {
  const message = await request("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Portfolio Visitor", email: "visitor@example.com", subject: "New project", message: "I would like to discuss a portfolio project." }) });
  assert.equal(message.response.status, 201);
  const unauthorizedInbox = await request("/api/messages");
  assert.equal(unauthorizedInbox.response.status, 401);
  const inbox = await authed("/api/messages");
  assert.equal(inbox.response.status, 200);
  assert.equal(inbox.body.some((item) => item.email === "visitor@example.com"), true);

  const visit = await request("/api/visits", { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "E2E Mobile" }, body: JSON.stringify({ visitorId: "e2e-visitor", path: "/#home", title: "Portfolio", language: "en", screen: "390x844" }) });
  assert.equal(visit.response.status, 201);
  const unauthorizedAnalytics = await request("/api/analytics");
  assert.equal(unauthorizedAnalytics.response.status, 401);
  const analytics = await authed("/api/analytics");
  assert.equal(analytics.response.status, 200);
  assert.ok(analytics.body.totalVisits >= 1);
  assert.ok(analytics.body.uniqueVisitors >= 1);
});

test("skills API rejects technologies outside the approved list", async () => {
  const state = (await request("/api/data")).body;
  const invalid = await authed("/api/data", { method: "PUT", body: JSON.stringify({ ...state, skills: [...state.skills, { id: "skill-invalid", name: "Angular", group: "Frontend", level: 80 }] }) });
  assert.equal(invalid.response.status, 400, JSON.stringify(invalid.body));
  assert.match(invalid.body.message, /approved portfolio technologies/i);
});
