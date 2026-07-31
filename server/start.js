import http from "node:http";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";
import { handleVercelRequest, initializePersistence } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const uploadDirs = [path.join(rootDir, "uploads"), path.join(rootDir, "public", "uploads"), path.join(distDir, "uploads")];
const port = Number(process.env.PORT || 3001);

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

async function serveStatic(request, response) {
  const requestedPath = request.url === "/" ? "/index.html" : decodeURIComponent(request.url.split("?")[0]);
  if (requestedPath.startsWith("/uploads/")) {
    const fileName = path.basename(requestedPath);
    for (const uploadDir of uploadDirs) {
      try {
        const filePath = path.join(uploadDir, fileName);
        const file = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const types = { ".mp4": "video/mp4", ".pdf": "application/pdf", ".webp": "image/webp", ".png": "image/png", ".gif": "image/gif", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
        response.writeHead(200, { ...securityHeaders(), "Content-Type": types[ext] || "application/octet-stream" });
        response.end(file);
        return;
      } catch {
        // Try the next local upload directory.
      }
    }
    response.writeHead(404, { ...securityHeaders(), "Content-Type": "text/plain; charset=utf-8" });
    response.end("Upload not found.");
    return;
  }

  const candidate = path.resolve(distDir, `.${requestedPath}`);
  const safePath = candidate === distDir || candidate.startsWith(`${distDir}${path.sep}`) ? candidate : path.join(distDir, "index.html");
  try {
    const file = await fs.readFile(safePath);
    const ext = path.extname(safePath).toLowerCase();
    const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".pdf": "application/pdf" };
    response.writeHead(200, { ...securityHeaders(), "Content-Type": types[ext] || "application/octet-stream", "Cache-Control": /[/\\]assets[/\\]/.test(safePath) ? "public, max-age=31536000, immutable" : "no-cache" });
    response.end(file);
  } catch {
    try {
      const index = await fs.readFile(path.join(distDir, "index.html"));
      response.writeHead(200, { ...securityHeaders(), "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
      response.end(index);
    } catch {
      response.writeHead(404, { ...securityHeaders(), "Content-Type": "text/plain; charset=utf-8" });
      response.end("Build the frontend first with npm run build.");
    }
  }
}

await initializePersistence();

const server = http.createServer((request, response) => {
  if (request.url?.startsWith("/api/")) return handleVercelRequest(request, response);
  return serveStatic(request, response);
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the old backend before starting another one.`);
    process.exitCode = 1;
    return;
  }
  console.error("Portfolio backend failed:", error);
  process.exitCode = 1;
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Portfolio backend running at http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => {
    process.exitCode = 0;
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
