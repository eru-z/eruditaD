import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const bucket = process.env.SUPABASE_BUCKET || "portfolio-media";
if (!url || !serviceKey) throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env before migration.");
if (/publishable|anon/i.test(serviceKey)) throw new Error("Use the server-only Supabase service_role key.");

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const runtimeData = path.join(root, ".portfolio-data", "portfolio.json");
const sourceData = await exists(runtimeData) ? runtimeData : path.join(root, "data", "portfolio.json");
const portfolio = JSON.parse(await fs.readFile(sourceData, "utf8"));
const mediaUrls = [...collectUploadUrls(portfolio)];
const replacements = new Map();

for (const mediaUrl of mediaUrls) {
  const requestedName = decodeURIComponent(path.basename(mediaUrl));
  const localFile = await locateUpload(requestedName);
  if (!localFile) {
    console.warn(`Skipping missing local media: ${mediaUrl}`);
    continue;
  }
  const objectPath = `migrated/${path.basename(localFile)}`;
  const buffer = await fs.readFile(localFile);
  const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
    contentType: contentType(localFile), cacheControl: "31536000", upsert: true,
  });
  if (error) throw new Error(`Could not migrate ${localFile}: ${error.message}`);
  replacements.set(mediaUrl, `${url}/storage/v1/object/public/${encodeURIComponent(bucket)}/${objectPath}`);
  console.log(`Migrated ${mediaUrl}`);
}

replaceUploadUrls(portfolio, replacements);
await upsertState("main", portfolio);
await migrateJsonState("messages", path.join(root, ".portfolio-data", "messages.json"), path.join(root, "data", "messages.json"));
await migrateJsonState("analytics", path.join(root, ".portfolio-data", "analytics.json"), path.join(root, "data", "analytics.json"));
console.log(`Supabase migration complete: ${replacements.size}/${mediaUrls.length} media references uploaded.`);

async function upsertState(id, data) {
  const { error } = await supabase.from("portfolio_state").upsert({ id, data, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Could not save ${id}: ${error.message}`);
}

async function migrateJsonState(id, preferred, fallback) {
  const file = await exists(preferred) ? preferred : fallback;
  if (!await exists(file)) return;
  await upsertState(id, JSON.parse(await fs.readFile(file, "utf8")));
}

function collectUploadUrls(value, found = new Set()) {
  if (typeof value === "string" && value.startsWith("/uploads/")) found.add(value);
  else if (Array.isArray(value)) value.forEach((item) => collectUploadUrls(item, found));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => collectUploadUrls(item, found));
  return found;
}

function replaceUploadUrls(value, replacements) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => { if (typeof item === "string" && replacements.has(item)) value[index] = replacements.get(item); else replaceUploadUrls(item, replacements); });
  } else if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (typeof item === "string" && replacements.has(item)) value[key] = replacements.get(item);
      else replaceUploadUrls(item, replacements);
    }
  }
}

async function locateUpload(requestedName) {
  const uploadDir = path.join(root, "uploads");
  const exact = path.join(uploadDir, requestedName);
  if (await exists(exact)) return exact;
  if (!await exists(uploadDir)) return "";
  const names = await fs.readdir(uploadDir);
  const suffix = names.find((name) => name.endsWith(requestedName));
  return suffix ? path.join(uploadDir, suffix) : "";
}

function contentType(file) {
  return ({ ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".mp4": "video/mp4", ".pdf": "application/pdf" })[path.extname(file).toLowerCase()] || "application/octet-stream";
}

async function exists(file) { try { await fs.access(file); return true; } catch { return false; } }
