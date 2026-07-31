import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const sizes = [
  [320, 568], [375, 667], [390, 844], [430, 932], [768, 1024],
  [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [1024, 600], [844, 390],
];
const port = 3214;
const origin = `http://127.0.0.1:${port}`;
const dataDir = await mkdtemp(path.join(os.tmpdir(), "portfolio-browser-"));
const server = spawn(process.execPath, ["server/index.js"], {
  cwd: process.cwd(),
  env: { ...process.env, NODE_ENV: "test", PORT: String(port), PORTFOLIO_DATA_DIR: dataDir, ADMIN_USERNAME: "audit", ADMIN_PASSWORD: "AuditPass123!", AI_API_KEY: "", SMTP_TEST_MODE: "true" },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try { if ((await fetch(`${origin}/api/health`)).ok) return; } catch { /* retry */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Production server did not become healthy.");
}

let browser;
try {
  await waitForServer();
  const publicProjects = await (await fetch(`${origin}/api/projects`)).json();
  const detailRoute = publicProjects[0]?.id ? `/projects/${encodeURIComponent(publicProjects[0].id)}` : "/projects";
  browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    for (const route of ["/", "/projects", detailRoute, "/admin"]) {
      const response = await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded", timeout: 30000 });
      if (!response?.ok()) throw new Error(`${route} returned ${response?.status()} at ${width}x${height}`);
      await page.waitForTimeout(750);
      const audit = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        hasMain: Boolean(document.querySelector("main")),
        brokenImages: [...document.images].filter((image) => image.complete && image.naturalWidth === 0).map((image) => image.src),
      }));
      if (audit.overflow > 1) throw new Error(`${route} overflows by ${audit.overflow}px at ${width}x${height}`);
      if (!audit.hasMain) throw new Error(`${route} has no main landmark at ${width}x${height}`);
      if (audit.brokenImages.length) throw new Error(`${route} has broken images: ${audit.brokenImages.join(", ")}`);
    }
  }

  await page.goto(`${origin}/admin/dashboard`, { waitUntil: "domcontentloaded" });
  if (!page.url().includes("/admin")) throw new Error("Protected admin route did not redirect to authentication.");

  for (const route of ["/", "/projects"]) {
    await page.goto(`${origin}${route}`, { waitUntil: "domcontentloaded" });
    const localLinks = await page.locator("a[href]").evaluateAll((links) => [...new Set(links.map((link) => link.href).filter((href) => href.startsWith(location.origin))) ]);
    for (const href of localLinks) {
      const url = new URL(href);
      if (url.hash && url.pathname === "/") continue;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Broken internal link ${url.pathname}: ${response.status}`);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  const assistant = page.getByRole("button", { name: "Open AI portfolio assistant" });
  await assistant.click();
  await page.getByRole("dialog").waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Close assistant" }).click();
  const theme = page.getByRole("button", { name: /Switch to (light|galaxy dark) mode/ });
  await theme.click();
  await page.reload({ waitUntil: "domcontentloaded" });
  if (runtimeErrors.length) throw new Error(`Browser runtime errors: ${runtimeErrors.join(" | ")}`);
  console.log(`Responsive browser audit passed for ${sizes.length} viewports and core interactive states.`);
  await context.close();
} finally {
  if (browser) await browser.close();
  server.kill("SIGTERM");
  await rm(dataDir, { recursive: true, force: true });
}
