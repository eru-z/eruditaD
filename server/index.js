import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';
import "dotenv/config";
import { defaultData } from "../src/data/defaultData.js";
import { projects as projectCaseStudies } from "../src/data/projectsData.js";
import { consumeOpenRouterStream, friendlyOpenRouterError, requestOpenRouterChat } from "./openrouter.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const SEED_DATA_DIR = path.join(ROOT_DIR, "data");
const DATA_DIR = process.env.PORTFOLIO_DATA_DIR || path.join(ROOT_DIR, ".portfolio-data");
const SEED_DATA_FILE = path.join(SEED_DATA_DIR, "portfolio.json");
const SEED_MESSAGES_FILE = path.join(SEED_DATA_DIR, "messages.json");
const SEED_ANALYTICS_FILE = path.join(SEED_DATA_DIR, "analytics.json");
const KNOWLEDGE_FILE = path.join(SEED_DATA_DIR, "knowledge.json");
const DATA_FILE = path.join(DATA_DIR, "portfolio.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics.json");
const APP_UPLOADS_DIR = path.join(ROOT_DIR, "uploads");
const PUBLIC_UPLOADS_DIR = path.join(ROOT_DIR, "public", "uploads");
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MINUTES || 30) * 60 * 1000;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || createHash("sha256").update(`local:${ADMIN_PASSWORD}`).digest("hex");
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const AI_API_KEY = process.env.AI_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "openrouter/free";
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 30000);
const PORTFOLIO_URL = process.env.PORTFOLIO_URL || (process.env.CORS_ORIGIN === "*" ? "" : process.env.CORS_ORIGIN) || "";
const MAX_MESSAGES_PER_VISITOR_PER_DAY = Number(process.env.MAX_MESSAGES_PER_VISITOR_PER_DAY || 25);
const DEV_MAX_MESSAGES_PER_VISITOR_PER_DAY = Number(process.env.DEV_MAX_MESSAGES_PER_VISITOR_PER_DAY || 8);
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS || 450);
const MONTHLY_BUDGET_USD = Number(process.env.MONTHLY_BUDGET_USD || 5);
const CHATBOT_DEV_MOCK_RESPONSES = /^(1|true|yes)$/i.test(process.env.CHATBOT_DEV_MOCK_RESPONSES || "");
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const IS_TEST = process.env.NODE_ENV === "test";
const SUPABASE_URL = IS_TEST ? "" : String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_SERVICE_ROLE_KEY = IS_TEST ? "" : (process.env.SUPABASE_SERVICE_ROLE_KEY || "");
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "portfolio-media";
const REQUIRE_DATABASE = !IS_TEST && process.env.NODE_ENV === "production" && /^(1|true|yes)$/i.test(
  process.env.REQUIRE_DATABASE || "true"
);
const CONTACT_EMAIL_TO = process.env.CONTACT_EMAIL_TO || 'eruditazilbearids@gmail.com';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_SECURE = !/^(0|false|no)$/i.test(process.env.SMTP_SECURE || 'true');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SMTP_TEST_MODE = process.env.SMTP_TEST_MODE === 'true' && process.env.NODE_ENV === 'test';
const loginAttempts = new Map();
const assistantCache = new Map();
const visitorLimits = new Map();
const usageLedger = { month: new Date().toISOString().slice(0, 7), inputTokens: 0, outputTokens: 0, estimatedCostUsd: 0 };
const MB = 1024 * 1024;
const JSON_BODY_LIMIT = 8 * MB;
const UPLOAD_BODY_LIMIT = 125 * MB;
const UPLOAD_LIMITS = {
  image: 12 * MB,
  pdf: 16 * MB,
  video: 80 * MB,
};
const MAX_FEATURED_PROJECTS = 3;
const PROJECT_STATUSES = new Set(["Published", "Draft"]);

const clone = (value) => JSON.parse(JSON.stringify(value));
let contactTransporter;
let remotePersistenceDisabled = false;

function escapeEmailHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getContactTransporter() {
  if (!SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new HttpError(503, 'Email delivery is not configured. Add SMTP_USER and SMTP_PASS to the server environment.');
  }
  if (!contactTransporter) {
    contactTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
    });
  }
  return contactTransporter;
}

async function emailContactMessage({ name, email, projectType, subject, message }) {
  if (SMTP_TEST_MODE) return { messageId: 'test-contact-message' };
  const safe = {
    name: escapeEmailHtml(name),
    email: escapeEmailHtml(email),
    projectType: escapeEmailHtml(projectType || 'Not specified'),
    subject: escapeEmailHtml(subject),
    message: escapeEmailHtml(message).replace(/\r?\n/g, '<br />'),
  };
  await getContactTransporter().sendMail({
    from: `Erudita Portfolio <${SMTP_FROM}>`,
    to: CONTACT_EMAIL_TO,
    replyTo: email,
    subject: `[Portfolio] ${subject}`,
    text: `New portfolio message\n\nName: ${name}\nEmail: ${email}\nProject type: ${projectType || 'Not specified'}\nSubject: ${subject}\n\n${message}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:auto;color:#101828"><h2>New portfolio message</h2><p><strong>Name:</strong> ${safe.name}</p><p><strong>Email:</strong> ${safe.email}</p><p><strong>Project type:</strong> ${safe.projectType}</p><p><strong>Subject:</strong> ${safe.subject}</p><hr style="border:0;border-top:1px solid #dbe4f0"><p style="line-height:1.7">${safe.message}</p></div>`,
  });
}

function hasAIKey() {
  return Boolean(AI_API_KEY);
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    try {
      await fs.copyFile(SEED_DATA_FILE, DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }
  }
}

async function ensureJsonFile(file, fallback, seedFile = "") {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(file);
  } catch {
    if (seedFile) {
      try {
        await fs.copyFile(seedFile, file);
        return;
      } catch {
        // Fall back to the default payload below.
      }
    }
    await fs.writeFile(file, JSON.stringify(fallback, null, 2));
  }
}

function hasRemotePersistence() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && !remotePersistenceDisabled);
}

let supabaseAdminClient;

function getSupabaseAdminClient() {
  if (!hasRemotePersistence()) return null;
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
  }
  return supabaseAdminClient;
}

function hasPartialRemoteConfig() {
  return Boolean(SUPABASE_URL) !== Boolean(SUPABASE_SERVICE_ROLE_KEY);
}

async function supabaseRequest(pathname, options = {}) {
  const response = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...options,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Remote persistence failed (${response.status})${detail ? `: ${detail}` : "."}`);
  }

  return response;
}

async function readLocalData() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  return { ...clone(defaultData), ...JSON.parse(raw.replace(/^\uFEFF/, "")) };
}

async function readData() {
  if (!hasRemotePersistence()) return readLocalData();

  const response = await supabaseRequest("/rest/v1/portfolio_state?id=eq.main&select=data&limit=1");
  const rows = await response.json();
  if (rows[0]?.data) return { ...clone(defaultData), ...rows[0].data };

  const seed = await readLocalData();
  await writeData(seed);
  return seed;
}

async function writeData(data) {
  const next = { ...clone(defaultData), ...data };

  if (hasRemotePersistence()) {
    await supabaseRequest("/rest/v1/portfolio_state?on_conflict=id", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({ id: "main", data: next, updated_at: new Date().toISOString() }),
    });
  }

  try {
    await ensureDataFile();
    await fs.writeFile(DATA_FILE, JSON.stringify(next, null, 2));
  } catch (error) {
    if (!hasRemotePersistence()) throw error;
  }
}

async function readRemoteState(id, fallback) {
  const response = await supabaseRequest(`/rest/v1/portfolio_state?id=eq.${encodeURIComponent(id)}&select=data&limit=1`);
  const rows = await response.json();
  return rows[0]?.data ?? fallback;
}

async function writeRemoteState(id, data) {
  await supabaseRequest("/rest/v1/portfolio_state?on_conflict=id", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({ id, data, updated_at: new Date().toISOString() }),
  });
}

async function readMessages() {
  if (hasRemotePersistence()) {
    const messages = await readRemoteState("messages", null);
    if (Array.isArray(messages)) return messages;
    const local = await readLocalMessages();
    await writeRemoteState("messages", local);
    return local;
  }
  return readLocalMessages();
}

async function readLocalMessages() {
  await ensureJsonFile(MESSAGES_FILE, [], SEED_MESSAGES_FILE);
  return JSON.parse((await fs.readFile(MESSAGES_FILE, "utf8")).replace(/^\uFEFF/, ""));
}

async function writeMessages(messages) {
  if (hasRemotePersistence()) await writeRemoteState("messages", messages);
  try {
    await ensureJsonFile(MESSAGES_FILE, [], SEED_MESSAGES_FILE);
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  } catch (error) {
    if (!hasRemotePersistence()) throw error;
  }
}

async function readAnalytics() {
  if (hasRemotePersistence()) {
    const analytics = await readRemoteState("analytics", null);
    if (analytics?.visits && Array.isArray(analytics.visits)) return analytics;
    const local = await readLocalAnalytics();
    await writeRemoteState("analytics", local);
    return local;
  }
  return readLocalAnalytics();
}

async function readLocalAnalytics() {
  await ensureJsonFile(ANALYTICS_FILE, { visits: [] }, SEED_ANALYTICS_FILE);
  return JSON.parse((await fs.readFile(ANALYTICS_FILE, "utf8")).replace(/^\uFEFF/, ""));
}

async function writeAnalytics(analytics) {
  if (hasRemotePersistence()) await writeRemoteState("analytics", analytics);
  try {
    await ensureJsonFile(ANALYTICS_FILE, { visits: [] }, SEED_ANALYTICS_FILE);
    await fs.writeFile(ANALYTICS_FILE, JSON.stringify(analytics, null, 2));
  } catch (error) {
    if (!hasRemotePersistence()) throw error;
  }
}
async function readKnowledge() {
  try {
    return JSON.parse((await fs.readFile(KNOWLEDGE_FILE, "utf8")).replace(/^\uFEFF/, ""));
  } catch {
    return {
      profile: {
        name: defaultData.profile?.name || "Erudita Zilbeari",
        role: defaultData.profile?.role || "",
        location: defaultData.profile?.location || "",
        about: defaultData.profile?.about || "",
        availability: defaultData.profile?.availabilityText || defaultData.contact?.availability || "",
      },
      contact: defaultData.contact || {},
      services: (defaultData.services || []).map((service) => service.title),
      skills: (defaultData.skills || []).map((skill) => skill.name),
      projects: (defaultData.projects || []).map((project) => ({
        name: project.title,
        description: project.description,
      })),
      faqs: [],
    };
  }
}

function mergeKnowledgeWithPortfolio(knowledge = {}, data = {}) {
  const compact = compactPortfolioData(data);
  const contact = compact.contact || {};
  const profile = data.profile || {};
  const currentEmail = contact.email || knowledge.contact?.email || "";
  const currentPhone = contact.phone || knowledge.contact?.phone || "";
  const currentAvailability = contact.availability || profile.availability || knowledge.profile?.availability || "";

  return {
    ...knowledge,
    profile: {
      ...(knowledge.profile || {}),
      name: compact.name || knowledge.profile?.name,
      role: profile.role || knowledge.profile?.role,
      location: compact.location || knowledge.profile?.location,
      headline: profile.headline || knowledge.profile?.headline,
      about: profile.about || knowledge.profile?.about,
      availability: currentAvailability,
    },
    contact: {
      ...(knowledge.contact || {}),
      ...contact,
      email: currentEmail,
      phone: currentPhone,
    },
    services: compact.services?.length
      ? compact.services.map((service) => service.title || service.description).filter(Boolean)
      : knowledge.services || [],
    skills: compact.technologies?.length ? compact.technologies : knowledge.skills || [],
    projects: compact.projects?.length
      ? compact.projects.map((project) => ({
          name: project.title || project.name,
          description: project.description,
        }))
      : knowledge.projects || [],
    faqs: (knowledge.faqs || []).map((faq) => {
      const question = normalizeQuestion(faq.question || "");
      if (question.includes("contact")) {
        return {
          ...faq,
          answer: `Use the Contact section on the portfolio website${currentEmail ? `, or email ${currentEmail}` : ""}.`,
        };
      }
      if (question.includes("available") || question.includes("availability")) {
        return { ...faq, answer: currentAvailability || faq.answer };
      }
      return faq;
    }),
  };
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

function initialsFor(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "??";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function summarizeAnalytics(visits) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const validVisits = (Array.isArray(visits) ? visits : []).filter((visit) => Number.isFinite(new Date(visit.createdAt).getTime()));
  const unique = new Set(validVisits.map((visit) => visit.visitorId || visit.ip).filter(Boolean));
  const today = validVisits.filter((visit) => now - new Date(visit.createdAt).getTime() < day);
  const week = validVisits.filter((visit) => now - new Date(visit.createdAt).getTime() < day * 7);
  const countBy = (items, selector) => items.reduce((acc, item) => {
    const key = selector(item) || "Unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const ranked = (counts, limit = 6, key = "label") => Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ [key]: label, count }));
  const deviceFor = (userAgent = "") => /mobile|android|iphone|ipad/i.test(userAgent) ? "Mobile" : /tablet/i.test(userAgent) ? "Tablet" : "Desktop";
  const referrerFor = (value = "") => {
    if (!value) return "Direct";
    try { return new URL(value).hostname.replace(/^www\./, "") || "Direct"; } catch { return "Other"; }
  };
  const dailyTrend = Array.from({ length: 14 }, (_, index) => {
    const offset = 13 - index;
    const start = new Date(now - offset * day);
    start.setHours(0, 0, 0, 0);
    const finish = start.getTime() + day;
    const rows = validVisits.filter((visit) => {
      const time = new Date(visit.createdAt).getTime();
      return time >= start.getTime() && time < finish;
    });
    return {
      date: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      visits: rows.length,
      visitors: new Set(rows.map((visit) => visit.visitorId || visit.ip).filter(Boolean)).size,
    };
  });
  const hourlyTrend = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${String(hour).padStart(2, "0")}:00`,
    visits: today.filter((visit) => new Date(visit.createdAt).getHours() === hour).length,
  }));

  return {
    generatedAt: new Date(now).toISOString(),
    totalVisits: validVisits.length,
    uniqueVisitors: unique.size,
    todayVisits: today.length,
    weekVisits: week.length,
    dailyTrend,
    hourlyTrend,
    topPages: ranked(countBy(validVisits, (visit) => visit.path || "/"), 8, "path"),
    referrers: ranked(countBy(validVisits, (visit) => referrerFor(visit.referrer)), 8),
    devices: ranked(countBy(validVisits, (visit) => deviceFor(visit.userAgent)), 4),
    languages: ranked(countBy(validVisits, (visit) => String(visit.language || "Unknown").split("-")[0].toUpperCase()), 8),
    recentVisits: validVisits.slice(0, 30),
  };
}
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function extensionForUpload(name = "", type = "") {
  const original = path.extname(name).toLowerCase();
  const byType = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "video/mp4": ".mp4",
    "application/pdf": ".pdf",
  };
  return byType[type] || original;
}

function typeForUpload(name = "", type = "") {
  const ext = path.extname(name).toLowerCase();
  if (type) return type;
  const byExt = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp4": "video/mp4",
    ".pdf": "application/pdf",
  };
  return byExt[ext] || "";
}

function isAllowedUpload(type = "", ext = "") {
  const allowedImages = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  return allowedImages.includes(type) || (type === "video/mp4" && ext === ".mp4") || (type === "application/pdf" && ext === ".pdf");
}

async function createSignedUpload({ name, type, size }) {
  if (!hasRemotePersistence()) throw new HttpError(503, "Direct uploads require Supabase Storage.");
  const normalizedType = typeForUpload(name, type);
  const ext = extensionForUpload(name, normalizedType);
  if (!isAllowedUpload(normalizedType, ext)) throw new HttpError(400, "Only images, PDF files, and .mp4 videos are allowed.");
  const byteSize = Number(size || 0);
  const maxBytes = normalizedType.startsWith("video/") ? UPLOAD_LIMITS.video : normalizedType === "application/pdf" ? UPLOAD_LIMITS.pdf : UPLOAD_LIMITS.image;
  if (!Number.isFinite(byteSize) || byteSize <= 0 || byteSize > maxBytes) throw new HttpError(413, `File must be between 1 byte and ${Math.floor(maxBytes / MB)}MB.`);
  const safeBase = path.basename(String(name || "upload"), path.extname(String(name || ""))).replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "upload";
  const fileName = `${Date.now()}-${randomBytes(8).toString("hex")}-${safeBase}${ext}`;
  const objectPath = `projects/${fileName}`;
  const { data, error } = await getSupabaseAdminClient().storage.from(SUPABASE_BUCKET).createSignedUploadUrl(objectPath);
  if (error || !data?.signedUrl) throw new HttpError(502, `Could not authorize the upload${error?.message ? `: ${error.message}` : "."}`);
  return {
    signedUrl: data.signedUrl,
    upload: {
      id: randomBytes(10).toString("hex"), name: String(name || fileName), type: normalizedType,
      url: `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(SUPABASE_BUCKET)}/${objectPath}`,
    },
  };
}

async function saveUpload({ name, type, dataUrl }) {
  const normalizedType = typeForUpload(name, type);
  const ext = extensionForUpload(name, normalizedType);
  if (!isAllowedUpload(normalizedType, ext)) {
    throw new Error("Only images, PDF files, and .mp4 videos are allowed.");
  }

  const [, encoded] = String(dataUrl || "").split(",");
  if (!encoded) throw new Error("Invalid upload payload.");

  const buffer = Buffer.from(encoded, "base64");
  const maxBytes = normalizedType.startsWith("video/")
    ? UPLOAD_LIMITS.video
    : normalizedType === "application/pdf"
      ? UPLOAD_LIMITS.pdf
      : UPLOAD_LIMITS.image;
  if (buffer.length > maxBytes) {
    throw new HttpError(
      413,
      normalizedType.startsWith("video/")
        ? "Video must be 80MB or smaller."
        : normalizedType === "application/pdf"
          ? "PDF must be 16MB or smaller."
          : "Image must be 12MB or smaller."
    );
  }

  const safeBase = path
    .basename(String(name || "upload"), path.extname(String(name || "")))
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "upload";
  const fileName = `${Date.now()}-${randomBytes(5).toString("hex")}-${safeBase}${ext}`;

  if (hasRemotePersistence()) {
    const objectPath = `projects/${fileName}`;
    await supabaseRequest(`/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${objectPath}`, {
      method: "POST",
      headers: {
        "Content-Type": normalizedType,
        "x-upsert": "false",
      },
      body: buffer,
    });

    return {
      id: randomBytes(10).toString("hex"),
      name: String(name || fileName),
      type: normalizedType,
      url: `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent(SUPABASE_BUCKET)}/${objectPath}`,
    };
  }

  await fs.mkdir(APP_UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(APP_UPLOADS_DIR, fileName), buffer);

  for (const mirrorDir of [PUBLIC_UPLOADS_DIR]) {
    try {
      await fs.mkdir(mirrorDir, { recursive: true });
      await fs.writeFile(path.join(mirrorDir, fileName), buffer);
    } catch {
      // OneDrive/public build folders may be read-only in some environments.
      // The canonical copy in uploads/ is still served by this backend.
    }
  }

  return {
    id: randomBytes(10).toString("hex"),
    name: String(name || fileName),
    type: normalizedType,
    url: `/uploads/${fileName}`,
  };
}

function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Content-Security-Policy": "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; media-src 'self' blob: https:; connect-src 'self' https:; worker-src 'self' blob:",
  };
}

function requestIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}

function safeCredentialEqual(received, expected) {
  const left = createHash("sha256").update(String(received || "")).digest();
  const right = createHash("sha256").update(String(expected || "")).digest();
  return timingSafeEqual(left, right);
}

async function consumeRateLimit(namespace, key, limit, windowSeconds, localStore) {
  const rateKey = `${namespace}:${key}`;
  if (hasRemotePersistence()) {
    const response = await supabaseRequest("/rest/v1/rpc/consume_portfolio_rate_limit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ p_key: rateKey, p_limit: limit, p_window_seconds: windowSeconds }),
    });
    const payload = await response.json();
    const result = Array.isArray(payload) ? payload[0] : payload;
    if (typeof result?.allowed !== "boolean") throw new Error("Supabase returned an invalid rate-limit response.");
    return result;
  }

  const now = Date.now();
  const current = localStore.get(rateKey);
  if (!current || now - current.startedAt >= windowSeconds * 1000) {
    localStore.set(rateKey, { count: 1, startedAt: now });
    return { allowed: true, remaining: Math.max(0, limit - 1), reset_at: new Date(now + windowSeconds * 1000).toISOString() };
  }
  current.count += 1;
  return { allowed: current.count <= limit, remaining: Math.max(0, limit - current.count), reset_at: new Date(current.startedAt + windowSeconds * 1000).toISOString() };
}

function loginRateKey(req) {
  return createHash("sha256").update(requestIp(req)).digest("hex").slice(0, 32);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": CORS_ORIGIN,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  };
}

function send(res, status, body, headers = {}) {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    ...securityHeaders(),
    ...corsHeaders(),
    ...headers,
  });
  res.end(payload);
}

function sendTextStream(res, extraHeaders = {}) {
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
    ...securityHeaders(),
    ...corsHeaders(),
    ...extraHeaders,
  });
}

function projectText(value, field, max, { required = false } = {}) {
  const text = String(value ?? "").trim();
  if (required && !text) throw new HttpError(400, `${field} is required.`);
  if (text.length > max) throw new HttpError(400, `${field} must be ${max} characters or fewer.`);
  return text;
}

function projectUrl(value, field) {
  const url = String(value ?? "").trim();
  if (!url) return "";
  if (!/^https?:\/\/\S+$/i.test(url) && !/^\/(?!\/)[^\s]*$/.test(url)) throw new HttpError(400, `${field} must be a valid http(s) or uploaded media URL.`);
  return url;
}

function projectList(value, field, maxItems = 30, maxLength = 120) {
  const list = Array.isArray(value) ? value : String(value ?? "").split(/[\n,]/);
  const clean = list.map((item) => projectText(item, field, maxLength)).filter(Boolean);
  if (clean.length > maxItems) throw new HttpError(400, `${field} supports at most ${maxItems} items.`);
  return [...new Set(clean)];
}

function validateProject(input = {}, existing = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new HttpError(400, "Project must be an object.");
  const merged = { ...existing, ...input };
  const year = Number(merged.year || new Date().getFullYear());
  if (!Number.isInteger(year) || year < 2000 || year > new Date().getFullYear() + 2) throw new HttpError(400, `Year must be between 2000 and ${new Date().getFullYear() + 2}.`);
  const status = merged.status === "Draft" ? "Draft" : merged.status || "Published";
  if (!PROJECT_STATUSES.has(status)) throw new HttpError(400, "Status must be Published or Draft.");
  const rawImages = Array.isArray(merged.images) ? merged.images : [];
  if (rawImages.length > 20) throw new HttpError(400, "A project supports at most 20 images.");
  const images = rawImages.map((image) => {
    const normalized = typeof image === "string" ? { url: image } : image || {};
    return { ...normalized, id: projectText(normalized.id, "Image id", 100), name: projectText(normalized.name, "Image name", 180), type: projectText(normalized.type, "Image type", 100), url: projectUrl(normalized.url, "Image URL") };
  }).filter((image) => image.url);
  return {
    ...merged,
    id: projectText(merged.id, "Project id", 100, { required: true }),
    title: projectText(merged.title, "Project title", 140, { required: true }),
    category: projectText(merged.category || merged.type, "Category", 80, { required: true }),
    description: projectText(merged.description, "Description", 5000),
    problem: projectText(merged.problem, "Problem", 8000),
    solution: projectText(merged.solution, "Solution", 8000),
    results: projectText(merged.results, "Results", 8000),
    projectRole: projectText(merged.projectRole, "Project role", 300),
    year, status, featured: Boolean(merged.featured),
    liveUrl: projectUrl(merged.liveUrl || merged.live, "Live URL"),
    githubUrl: projectUrl(merged.githubUrl || merged.github, "GitHub URL"),
    videoUrl: projectUrl(merged.videoUrl || (typeof merged.video === "string" ? merged.video : merged.video?.url), "Video URL"),
    coverImage: projectUrl(merged.coverImage || merged.image, "Cover image URL"),
    tags: projectList(merged.tags || merged.technologies || merged.tech, "Technologies"),
    filters: projectList(merged.filters, "Categories", 15),
    techDecisions: projectList(merged.techDecisions, "Technical decisions", 30, 500),
    impactDetails: projectList(merged.impactDetails, "Impact details", 30, 500),
    images,
    updatedAt: new Date().toISOString(),
  };
}

function validateProjectCollection(projects) {
  if (!Array.isArray(projects)) throw new HttpError(400, "Projects must be an array.");
  if (projects.length > 500) throw new HttpError(400, "A maximum of 500 projects is supported.");
  const normalized = projects.map((project, order) => ({ ...validateProject(project), order }));
  const ids = normalized.map((project) => project.id);
  if (new Set(ids).size !== ids.length) throw new HttpError(409, "Every project must have a unique id.");
  if (normalized.filter((project) => project.featured).length > MAX_FEATURED_PROJECTS) throw new HttpError(409, "Only 3 projects can be featured. Unfeature another project first.");
  return normalized;
}

function publicProjects(projects) {
  return validateProjectCollection(projects || []).filter((project) => project.status === "Published");
}
const APPROVED_SKILLS = new Map([
  ["react.js", "React.js"], ["react js", "React.js"], ["node.js", "Node.js"], ["python", "Python"], ["html", "HTML"], ["css", "CSS"], ["js", "JS"], ["javascript", "JS"], ["wordpress", "WordPress"], ["bootstrap", "Bootstrap"], ["git/github", "git/GitHub"], ["git", "git/GitHub"], ["github", "git/GitHub"], ["expo", "Expo"], ["vercel", "Vercel"], ["hosting/domains", "Hosting/Domains"], ["hosting", "Hosting/Domains"], ["supabase", "Supabase"], ["react native", "React Native"], ["tailwind", "Tailwind"], ["tailwind css", "Tailwind"], ["php", "PHP"], ["postgresql", "PostgreSQL"], ["mysql", "MySQL"],
]);

function approvedSkillName(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const approved = APPROVED_SKILLS.get(normalized);
  if (!approved) throw new HttpError(400, "Only approved portfolio technologies can be added as skills.");
  return approved;
}
function validateSkillCollection(skills) {
  if (!Array.isArray(skills)) throw new HttpError(400, "Skills must be an array.");
  if (skills.length > 200) throw new HttpError(400, "A maximum of 200 skills is supported.");
  const normalized = skills.map((skill, order) => {
    if (!skill || typeof skill !== "object" || Array.isArray(skill)) throw new HttpError(400, "Skill must be an object.");
    const level = Number(skill.level ?? 0);
    if (!Number.isFinite(level) || level < 0 || level > 100) throw new HttpError(400, "Skill level must be between 0 and 100.");
    return { ...skill, id: projectText(skill.id || `skill-${String(skill.name || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${order}`, "Skill id", 100, { required: true }), name: approvedSkillName(projectText(skill.name, "Skill name", 100, { required: true })), group: projectText(skill.group || skill.category, "Skill category", 80, { required: true }), logo: projectUrl(skill.logo || skill.image, "Skill logo"), level: Math.round(level), published: skill.published !== false, order };
  });
  const ids = normalized.map((skill) => skill.id);
  const names = normalized.map((skill) => skill.name.toLowerCase());
  if (new Set(ids).size !== ids.length) throw new HttpError(409, "Skill ids must be unique.");
  if (new Set(names).size !== names.length) throw new HttpError(409, "Skill names must be unique.");
  return normalized;
}
function validateAchievementCollection(achievements = {}) {
  if (!achievements || typeof achievements !== "object" || Array.isArray(achievements)) throw new HttpError(400, "Achievements must be an object.");
  const normalizeItems = (items, type) => {
    if (!Array.isArray(items)) throw new HttpError(400, `${type} must be an array.`);
    if (items.length > 100) throw new HttpError(400, `${type} supports at most 100 items.`);
    const normalized = items.map((item, order) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) throw new HttpError(400, `${type} item must be an object.`);
      const result = { ...item, id: projectText(item.id, `${type} id`, 100, { required: true }), title: projectText(item.title, `${type} title`, 180, { required: true }), published: item.published !== false, order };
      if (type === "Recognitions") {
        result.subtitle = projectText(item.subtitle, "Achievement subtitle", 300);
        result.description = projectText(item.description, "Achievement description", 5000);
        result.year = projectText(item.year, "Achievement year", 40);
        result.tags = projectList(item.tags, "Achievement tags", 20, 80);
      } else {
        result.issuer = projectText(item.issuer, "Certificate issuer", 180);
        result.image = projectUrl(item.image, "Certificate image");
        result.credentialUrl = projectUrl(item.credentialUrl, "Credential URL");
        result.featured = Boolean(item.featured);
      }
      return result;
    });
    const ids = normalized.map((item) => item.id);
    if (new Set(ids).size !== ids.length) throw new HttpError(409, `${type} ids must be unique.`);
    return normalized;
  };
  return { ...achievements, recognitions: normalizeItems(achievements.recognitions || [], "Recognitions"), certificates: normalizeItems(achievements.certificates || [], "Certificates"), clients: Array.isArray(achievements.clients) ? achievements.clients : [] };
}
function createAdminToken() {
  const payload = Buffer.from(JSON.stringify({
    username: ADMIN_USERNAME,
    expiresAt: Date.now() + ADMIN_SESSION_TTL_MS,
    nonce: randomBytes(12).toString("hex"),
  })).toString("base64url");
  const signature = createHmac("sha256", ADMIN_SESSION_SECRET).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function readAdminToken(req) {
  const token = req.headers.authorization?.match(/^Bearer\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/)?.[1];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  const expected = createHmac("sha256", ADMIN_SESSION_SECRET).update(payload).digest();
  let received;
  try { received = Buffer.from(signature, "base64url"); } catch { return null; }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (session.username !== ADMIN_USERNAME || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

function isAuthed(req) {
  return Boolean(readAdminToken(req));
}

function authStatus(req) {
  const authenticated = isAuthed(req);
  return { authenticated, username: authenticated ? ADMIN_USERNAME : "" };
}

function pickFields(items, fields, limit = 20) {
  return (Array.isArray(items) ? items : [])
    .slice(0, limit)
    .map((item) =>
      fields.reduce((entry, field) => {
        const value = item?.[field];
        if (value !== undefined && value !== null && value !== "") entry[field] = value;
        return entry;
      }, {})
    )
    .filter((item) => Object.keys(item).length);
}

function compactPortfolioData(data) {
  const profile = data?.profile || {};
  const contact = data?.contact || {};
  const achievements = data?.achievements || {};
  const savedProjects = pickFields(data?.projects, ["title", "category", "description", "tags", "technologies", "tech", "year", "status", "featured", "price", "pricing"], 12);
  const caseStudyProjects = pickFields(projectCaseStudies, ["title", "category", "type", "description", "tech", "status", "year", "liveUrl", "caseStudyUrl"], 12);
  const projects = [...savedProjects, ...caseStudyProjects]
    .filter((project, index, all) => project.title && all.findIndex((item) => item.title === project.title) === index)
    .slice(0, 14);

  return {
    name: profile.name || "Erudita Zilbeari",
    location: profile.location || contact.location || "Tetovo, North Macedonia",
    roles: [
      "Full-Stack Web Developer",
      "Mobile Developer",
      "UI/UX Designer",
    ],
    headline: profile.headline,
    about: profile.about,
    services: pickFields(data?.services, ["title", "description", "price", "pricing"], 20),
    projects,
    experience: pickFields(data?.experience, ["role", "company", "period", "description", "tags", "technologies"], 20),
    skills: pickFields(data?.skills, ["name", "level", "group"], 50),
    technologies: [
      ...new Set(
        [
          ...(Array.isArray(data?.skills) ? data.skills.map((skill) => skill?.name) : []),
          ...projects.flatMap((project) => [
            ...(Array.isArray(project.tags) ? project.tags : []),
            ...(Array.isArray(project.tech) ? project.tech : []),
            ...(typeof project.technologies === "string" ? project.technologies.split(",") : []),
          ]),
        ]
          .map((item) => String(item || "").trim())
          .filter(Boolean)
      ),
    ],
    achievements: {
      recognitions: pickFields(achievements.recognitions, ["title", "event", "issuer", "year", "description", "published"], 20),
      clients: pickFields(achievements.clients, ["name", "description", "url", "published"], 20),
    },
    certificates: pickFields(achievements.certificates, ["title", "issuer", "year", "description", "published"], 30),
    contact: {
      email: contact.email || profile.email,
      phone: contact.phone || profile.phone,
      location: contact.location || profile.location,
      availability: contact.availability || profile.availabilityText,
      bookingUrl: data?.bookingUrl,
    },
    pricing: [
      ...pickFields(data?.services, ["title", "price", "pricing"], 20),
      ...pickFields(data?.projects, ["title", "price", "pricing"], 20),
    ].filter((item) => item.price || item.pricing),
  };
}

function logAssistantError(error) {
  if (process.env.NODE_ENV === "production") return;
  console.error("[assistant] OpenAI request failed", {
    status: error?.status,
    code: error?.code,
    message: error?.message,
  });
}


function normalizeAssistantMessagesV2(messages, latestUserMessage = "") {
  const latest = String(latestUserMessage || "").trim().slice(0, 6000);
  const history = (Array.isArray(messages) ? messages : [])
    .filter((message) => ["user", "assistant"].includes(message?.role))
    .map((message) => ({
      role: message.role,
      content: String(message.content || message.text || "").trim().slice(0, 6000),
    }))
    .filter((message) => message.content);

  if (!latest) return history.slice(-40);

  const deduped = history.filter((message, index) => {
    const isLast = index === history.length - 1;
    return !(isLast && message.role === "user" && message.content === latest);
  });

  return [...deduped.slice(-39), { role: "user", content: latest }];
}

function normalizeAssistantSpacing(text = "") {
  return String(text)
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/([,.!?;:])(?=\S)/g, "$1 ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function resetUsageMonthIfNeeded() {
  const month = currentMonthKey();
  if (usageLedger.month === month) return;
  usageLedger.month = month;
  usageLedger.inputTokens = 0;
  usageLedger.outputTokens = 0;
  usageLedger.estimatedCostUsd = 0;
}

function budgetReached() {
  resetUsageMonthIfNeeded();
  return MONTHLY_BUDGET_USD > 0 && usageLedger.estimatedCostUsd >= MONTHLY_BUDGET_USD;
}

function estimateTokens(text = "") {
  return Math.max(1, Math.ceil(String(text).length / 4));
}

function priceForModel(model = AI_MODEL) {
  const name = String(model).toLowerCase();
  if (name.includes("gpt-5-nano")) return { input: 0.05, output: 0.4 };
  if (name.includes("gpt-5-mini")) return { input: 0.25, output: 2 };
  if (name.includes("gpt-4.1-nano")) return { input: 0.1, output: 0.4 };
  if (name.includes("gpt-4o-mini")) return { input: 0.15, output: 0.6 };
  return { input: 0.15, output: 0.6 };
}

function trackOpenAIUsage({ inputText = "", outputText = "", source = "openai" } = {}) {
  resetUsageMonthIfNeeded();
  const inputTokens = estimateTokens(inputText);
  const outputTokens = estimateTokens(outputText);
  const price = priceForModel();
  const cost = (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
  usageLedger.inputTokens += inputTokens;
  usageLedger.outputTokens += outputTokens;
  usageLedger.estimatedCostUsd += cost;
  console.log("[assistant] usage", {
    source,
    model: AI_MODEL,
    inputTokens,
    outputTokens,
    estimatedRequestCostUsd: Number(cost.toFixed(6)),
    estimatedMonthlyCostUsd: Number(usageLedger.estimatedCostUsd.toFixed(4)),
    monthlyBudgetUsd: MONTHLY_BUDGET_USD,
  });
}

function visitorKey(req) {
  const raw = `${getClientIp(req)}|${req.headers["user-agent"] || ""}`;
  return createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

function dailyLimitForEnvironment() {
  return process.env.NODE_ENV === "production"
    ? MAX_MESSAGES_PER_VISITOR_PER_DAY
    : Math.min(MAX_MESSAGES_PER_VISITOR_PER_DAY, DEV_MAX_MESSAGES_PER_VISITOR_PER_DAY);
}

async function checkVisitorLimit(req) {
  return consumeRateLimit(
    "assistant",
    visitorKey(req),
    dailyLimitForEnvironment(),
    24 * 60 * 60,
    visitorLimits
  );
}
function cacheKeyFor(messages, latestUserMessage = "") {
  const latest = String(latestUserMessage || "").trim().toLowerCase().replace(/\s+/g, " ");
  const lastContext = normalizeAssistantMessagesV2(messages, "").slice(-4);
  return createHash("sha256").update(JSON.stringify({ latest, lastContext })).digest("hex");
}

function getCachedReply(key) {
  const entry = assistantCache.get(key);
  if (!entry) return "";
  if (Date.now() - entry.createdAt > 60 * 60 * 1000) {
    assistantCache.delete(key);
    return "";
  }
  return entry.text;
}

function setCachedReply(key, text) {
  if (!text || assistantCache.size > 250) assistantCache.clear();
  assistantCache.set(key, { text, createdAt: Date.now() });
}


function normalizeQuestion(text = "") {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0400-\u04ff\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectAssistantLocale(message = "") {
  const raw = String(message).toLowerCase();
  const q = normalizeQuestion(raw);
  if (/[\u0400-\u04ff]/.test(raw)) return "mk";
  if (/\b(hallo|danke|bitte|wer|welche|projekt|kontaktieren|fahigkeit|dienstleistung)\b/.test(q)) return "de";
  if (/\b(xhi|qka|cka|ca|qysh|osht|jom|kom|bon|du|munesh|mair)\b/.test(q)) return "tetovo";
  if (/\b(pershendetje|kush|eshte|aftesi|sherbime|projekte|kontakt|disponueshme)\b/.test(q)) return "sq";
  return "en";
}

function formatList(items = [], mapper = (item) => item) {
  return items.map(mapper).filter(Boolean).slice(0, 8).join(", ");
}

function localPortfolioReply(message = "", knowledge = {}) {
  const locale = detectAssistantLocale(message);
  const q = normalizeQuestion(message);
  const profile = knowledge.profile || {};
  const contact = knowledge.contact || {};
  const services = Array.isArray(knowledge.services) ? knowledge.services : [];
  const skills = Array.isArray(knowledge.skills) ? knowledge.skills : [];
  const projects = Array.isArray(knowledge.projects) ? knowledge.projects : [];
  const faqs = Array.isArray(knowledge.faqs) ? knowledge.faqs : [];

  const faq = faqs.find((item) => {
    const question = normalizeQuestion(item?.question);
    return q.length > 4 && (question.includes(q) || q.includes(question));
  });
  if (faq?.answer) return String(faq.answer);

  if (/^(hi|hello|hey|hallo|pershendetje|tung|zdravo)\b/.test(q)) {
    return localizedText(locale, {
      en: "Hi! Ask me about Erudita's projects, services, skills, availability, or contact information.",
      sq: "Pershendetje! Mund te me pyesesh per projektet, sherbimet, aftesite, disponueshmerine ose kontaktin e Erudites.",
      tetovo: "Pershendetje! Munesh me m'pyet per projektet, sherbimet, aftesite, disponueshmerine ose kontaktin e Erudites.",
      mk: "Zdravo! Prasajte me za proektite, uslugite, vestinite, dostupnosta ili kontaktot na Erudita.",
      de: "Hallo! Frag mich nach Eruditas Projekten, Leistungen, Kenntnissen, Verfuegbarkeit oder Kontaktdaten.",
    });
  }

  if (/\b(contact|email|mail|phone|telefon|reach|kontakt|kontakto|kontaktiram)\b/.test(q)) {
    const details = [contact.email || profile.email, contact.phone || profile.phone, contact.location || profile.location].filter(Boolean).join(" · ");
    return localizedText(locale, {
      en: `You can contact Erudita through the Contact section${details ? ` or directly at ${details}` : ""}.`,
      sq: `Mund ta kontaktosh Eruditen nga seksioni Contact${details ? ` ose direkt ne ${details}` : ""}.`,
      tetovo: `Munesh me kontaktu Eruditen te seksioni Contact${details ? ` ose direkt ne ${details}` : ""}.`,
      mk: `Mozete da ja kontaktirate Erudita preku Contact sekcijata${details ? ` ili direktno na ${details}` : ""}.`,
      de: `Du kannst Erudita ueber den Kontaktbereich erreichen${details ? ` oder direkt unter ${details}` : ""}.`,
    });
  }

  if (/\b(skill|skills|technology|technologies|stack|aftesi|teknologji|vestini|kenntnisse)\b/.test(q)) {
    const list = formatList(skills, (item) => item?.name || item);
    return localizedText(locale, {
      en: `Erudita's core technologies include ${list || "React, React Native, Node.js, Python, PostgreSQL, MySQL, Tailwind CSS, and Supabase"}.`,
      sq: `Teknologjite kryesore te Erudites perfshijne ${list || "React, React Native, Node.js, Python, PostgreSQL, MySQL, Tailwind CSS dhe Supabase"}.`,
      tetovo: `Teknologjite kryesore t'Erudites jane ${list || "React, React Native, Node.js, Python, PostgreSQL, MySQL, Tailwind CSS edhe Supabase"}.`,
      mk: `Glavnite tehnologii na Erudita se ${list || "React, React Native, Node.js, Python, PostgreSQL, MySQL, Tailwind CSS i Supabase"}.`,
      de: `Eruditas wichtigste Technologien sind ${list || "React, React Native, Node.js, Python, PostgreSQL, MySQL, Tailwind CSS und Supabase"}.`,
    });
  }

  if (/\b(project|projects|portfolio|work|projekt|projekte|projektet|proekti)\b/.test(q)) {
    const list = formatList(projects.filter((item) => item?.status !== "Draft"), (item) => item?.title);
    return localizedText(locale, {
      en: `Featured portfolio work includes ${list || "the projects shown in the Projects section"}. Open View All Projects for details and case studies.`,
      sq: `Projektet e portfolios perfshijne ${list || "projektet ne seksionin Projects"}. Hap View All Projects per detaje dhe case studies.`,
      tetovo: `Projektet e portfolios jane ${list || "projektet te seksioni Projects"}. Hape View All Projects per detaje edhe case studies.`,
      mk: `Portfolio proektite vklucuvaat ${list || "proektite vo sekcijata Projects"}. Otvorete View All Projects za detali.`,
      de: `Zu den Portfolio-Projekten gehoeren ${list || "die Projekte im Bereich Projects"}. Unter View All Projects findest du Details.`,
    });
  }

  if (/\b(service|services|offer|sherbim|sherbime|uslugi|leistung|leistungen)\b/.test(q)) {
    const list = formatList(services, (item) => item?.title || item?.name || item);
    return localizedText(locale, {
      en: `Erudita offers ${list || "web development, mobile development, UI/UX design, backend development, APIs, and database design"}.`,
      sq: `Erudita ofron ${list || "zhvillim web, zhvillim mobil, UI/UX, backend, API dhe databaza"}.`,
      tetovo: `Erudita ofron ${list || "web, mobile, UI/UX, backend, API edhe databaza"}.`,
      mk: `Erudita nudi ${list || "web i mobilna izrabotka, UI/UX, backend, API i bazi na podatoci"}.`,
      de: `Erudita bietet ${list || "Web- und Mobile-Entwicklung, UI/UX, Backend, APIs und Datenbanken"}.`,
    });
  }

  if (/\b(available|availability|hire|book|schedule|disponueshme|dostapnost|verfugbar)\b/.test(q)) {
    const availability = contact.availability || profile.availabilityText || "available for selected projects";
    return localizedText(locale, {
      en: `Erudita is ${availability}. Use the Contact section to discuss your project.`,
      sq: `Erudita eshte ${availability}. Perdore seksionin Contact per te diskutuar projektin.`,
      tetovo: `Erudita osht ${availability}. Shkruj te Contact per me fol per projektin.`,
      mk: `Erudita e ${availability}. Koristete ja Contact sekcijata za vasiot proekt.`,
      de: `Erudita ist ${availability}. Nutze den Kontaktbereich, um dein Projekt zu besprechen.`,
    });
  }

  if (/\b(who is|who are you|kush eshte|kush osht|wer ist)\b/.test(q)) {
    const summary = profile.bio || profile.summary || `${profile.name || "Erudita Zilbeari"} is a full-stack web and mobile developer and UI/UX designer.`;
    return String(summary);
  }

  return "";
}
function localizedText(locale, variants) {
  return variants[locale] || variants.en || "";
}

function openAISystemPrompt(data, knowledge) {
  return [
    "You are Erudita AI, a public portfolio chatbot for Erudita Zilbeari.",
    "Reply naturally in the exact same language and dialect as the user's latest message. Never mix languages.",
    "If the user writes Tetovo/Pollog Albanian, reply in light Tetovo/Pollog Albanian only and do not drift into Kosovo slang.",
    "Keep answers concise by default, usually 1 to 4 sentences, unless the user asks for more detail.",
    "For questions about Erudita, use only the supplied portfolio data and knowledge base as source of truth. Never invent portfolio facts.",
    "For general questions, answer normally and helpfully. Refuse harmful or illegal requests briefly.",
    "Use markdown only when useful. Code blocks, lists and bold text are allowed.",
    "Keep normal spacing and punctuation. No glued words, broken words or malformed characters.",
    "",
    "Knowledge base:",
    JSON.stringify(knowledge, null, 2),
    "",
    "Current portfolio data:",
    JSON.stringify(compactPortfolioData(data), null, 2),
  ].join("\n");
}

async function openAIChatMessages(messages, latestUserMessage = "") {
  const data = await readData();
  const knowledge = mergeKnowledgeWithPortfolio(await readKnowledge(), data);
  const chatMessages = normalizeAssistantMessagesV2(messages, latestUserMessage).slice(-10);
  if (!chatMessages.some((message) => message.role === "user")) {
    throw new HttpError(400, "Please enter a message first.");
  }
  return {
    data,
    knowledge,
    chatMessages,
    messages: [
      { role: "system", content: openAISystemPrompt(data, knowledge) },
      ...chatMessages,
    ],
  };
}

function callAI(messages, stream, signal) {
  return requestOpenRouterChat({
    apiKey: AI_API_KEY,
    model: AI_MODEL,
    messages,
    stream,
    maxTokens: MAX_OUTPUT_TOKENS,
    signal,
    siteUrl: PORTFOLIO_URL,
  });
}
function cleanDevelopmentMockReply(latestUserMessage = "") {
  const locale = detectAssistantLocale(latestUserMessage);
  return localizedText(locale, {
    en: "Development mock reply: the chatbot is connected, but OpenAI was skipped to save credits.",
    sq: "Pergjigje testimi: chatbot-i eshte i lidhur, por OpenAI u anashkalua per te kursyer kredit.",
    tetovo: "Pergjigje testimi: chatbot-i osht i lidhun, po OpenAI u anashkalu per me kursy kredit.",
    mk: "Test response: chatbot-ot e povrzan, no OpenAI bese preskoknat za da se zastedi kredit.",
    de: "Testantwort: Der Chatbot ist verbunden, aber OpenAI wurde uebersprungen, um Guthaben zu sparen.",
  });
}

async function preparePublicAssistant(req, messages, latestUserMessage = "") {
  const limit = await checkVisitorLimit(req);
  if (!limit.allowed) {
    throw new HttpError(429, "Daily chat limit reached. Please try again tomorrow or contact Erudita through the Contact section.");
  }

  const latest = String(latestUserMessage || "").trim();
  const data = await readData();
  const knowledge = mergeKnowledgeWithPortfolio(await readKnowledge(), data);
  const localReply = localPortfolioReply(latest, knowledge);
  const key = cacheKeyFor(messages, latest);
  const cached = getCachedReply(key);

  if (localReply) {
    setCachedReply(key, localReply);
    return { type: "local", text: localReply, key };
  }

  if (cached) return { type: "cache", text: cached, key };

  if (budgetReached()) {
    throw new HttpError(429, "The monthly AI budget has been reached. Please contact Erudita through the Contact section.");
  }

  if (process.env.NODE_ENV !== "production" && CHATBOT_DEV_MOCK_RESPONSES) {
    const text = cleanDevelopmentMockReply(latest);
    setCachedReply(key, text);
    return { type: "mock", text, key };
  }

  if (!hasAIKey()) {
    const text = localizedText(detectAssistantLocale(latest), {
      en: "The live AI model is not configured yet, but I can still help with portfolio basics like projects, services, skills, availability and contact information.",
      sq: "Modeli live i AI nuk eshte konfiguruar ende, por mund te ndihmoj me informacionet kryesore te portfolios: projektet, sherbimet, aftesite, disponueshmerine dhe kontaktin.",
      tetovo: "Modeli live i AI nuk osht konfiguru hala, po muj me ndihmu per projektet, sherbimet, aftesite, disponueshmerine edhe kontaktin.",
      mk: "Live AI modelot ne e konfiguriran, no mozam da pomognam so osnovni portfolio informacii: proekti, uslugi, vestini, dostapnost i kontakt.",
      de: "Das Live-AI-Modell ist noch nicht konfiguriert, aber ich kann mit Portfolio-Grundlagen wie Projekten, Services, Faehigkeiten, Verfuegbarkeit und Kontaktinfos helfen.",
    });
    setCachedReply(key, text);
    return { type: "unconfigured", text, key };
  }

  return { type: "openrouter", key, ...(await openAIChatMessages(messages, latest)) };
}

async function createPublicAssistantReply(req, messages, latestUserMessage = "") {
  const prepared = await preparePublicAssistant(req, messages, latestUserMessage);
  if (prepared.text) return prepared.text;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const response = await callAI(prepared.messages, false, controller.signal);
    const payload = await response.json();
    const text = normalizeAssistantSpacing(payload?.choices?.[0]?.message?.content || "");
    if (!text) throw new Error("Empty OpenRouter response.");
    setCachedReply(prepared.key, text);
    trackOpenAIUsage({ inputText: JSON.stringify(prepared.messages), outputText: text, source: "openrouter" });
    return text;
  } catch (error) {
    logAssistantError(error);
    throw new HttpError(error?.status || 502, friendlyOpenRouterError(error));
  } finally {
    clearTimeout(timeout);
  }
}

async function streamPublicAssistantReply(req, res, messages, latestUserMessage = "") {
  let prepared;
  try {
    prepared = await preparePublicAssistant(req, messages, latestUserMessage);
  } catch (error) {
    const requestId = String(req.headers["x-vercel-id"] || randomBytes(6).toString("hex"));
    const status = error instanceof HttpError ? error.status : 500;
    console.error("[api-error]", { requestId, method: req.method, path: req.url, status, message: error?.message || "Unknown error" });
    return send(
      res,
      status,
      { message: error instanceof HttpError ? error.message : "The server could not complete this request. Please retry.", requestId },
      { "Cache-Control": "no-store" }
    );
  }

  sendTextStream(res, { "X-Assistant-Source": prepared.type });

  if (prepared.text) {
    res.end(prepared.text);
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  req.on("close", () => controller.abort());
  let fullText = "";

  try {
    const response = await callAI(prepared.messages, true, controller.signal);
    fullText = await consumeOpenRouterStream(response, (delta) => res.write(delta));

    const finalText = normalizeAssistantSpacing(fullText);
    if (finalText) {
      setCachedReply(prepared.key, finalText);
      trackOpenAIUsage({ inputText: JSON.stringify(prepared.messages), outputText: finalText, source: "openrouter-stream" });
    } else {
      res.write("The assistant could not generate a response. Please try again.");
    }
  } catch (error) {
    logAssistantError(error);
    if (!fullText) res.write(friendlyOpenRouterError(error));
  } finally {
    clearTimeout(timeout);
    res.end();
  }
}

function readBody(req, { limitBytes = JSON_BODY_LIMIT } = {}) {
  return new Promise((resolve, reject) => {
    let body = "";
    let finished = false;
    req.on("data", (chunk) => {
      if (finished) return;
      body += chunk;
      if (Buffer.byteLength(body) > limitBytes) {
        finished = true;
        req.pause();
        reject(new HttpError(413, "Request body is too large."));
      }
    });
    req.on("end", () => {
      if (finished) return;
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new HttpError(400, "Invalid JSON."));
      }
    });
    req.on("error", (error) => {
      if (!finished) reject(error);
    });
  });
}

async function handleApi(req, res) {
  if (req.method === "OPTIONS") return send(res, 204);

  try {
    const url = new URL(req.url, "http://127.0.0.1");

    if (url.pathname === "/api/health" && req.method === "GET") {
      if (hasRemotePersistence()) {
        await supabaseRequest("/rest/v1/portfolio_state?select=id&limit=1", { headers: { "Cache-Control": "no-cache" } });
      }
      return send(res, 200, {
        ok: true,
        service: "portfolio-backend",
        persistence: hasRemotePersistence() ? "supabase" : "filesystem",
        durable: hasRemotePersistence(),
        assistant: {
          provider: "openrouter",
          configured: hasAIKey(),
          model: AI_MODEL,
          streaming: true,
        },
      });
    }

    if (url.pathname === "/api/login" && req.method === "POST") {
      const loginLimit = await consumeRateLimit("admin-login", loginRateKey(req), LOGIN_MAX_ATTEMPTS, LOGIN_WINDOW_MS / 1000, loginAttempts);
      if (!loginLimit.allowed) return send(res, 429, { message: "Too many sign-in attempts. Try again in 15 minutes." }, { "Retry-After": "900", "Cache-Control": "no-store" });
      const { username, password } = await readBody(req, { limitBytes: 16 * 1024 });
      const valid = safeCredentialEqual(username, ADMIN_USERNAME) & safeCredentialEqual(password, ADMIN_PASSWORD);
      if (valid) {
        const token = createAdminToken();
        return send(res, 200, { token, username: ADMIN_USERNAME }, { "Cache-Control": "no-store" });
      }
      return send(res, 401, { message: "Invalid username or password." }, { "Cache-Control": "no-store" });
    }

    if (url.pathname === "/api/session" && req.method === "GET") {
      const status = authStatus(req);
      return send(res, status.authenticated ? 200 : 401, status);
    }

    if (url.pathname === "/api/logout" && req.method === "POST") {
      return send(res, 200, { ok: true });
    }

    if (url.pathname === "/api/projects" && req.method === "GET") {
      const data = await readData();
      const includeDrafts = url.searchParams.get("includeDrafts") === "1";
      if (includeDrafts && !isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const projects = includeDrafts ? validateProjectCollection(data.projects || []) : publicProjects(data.projects || []);
      return send(res, 200, { projects, featuredLimit: MAX_FEATURED_PROJECTS }, { "Cache-Control": "no-store" });
    }

    if (url.pathname === "/api/projects" && req.method === "POST") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const data = await readData();
      const project = validateProject(await readBody(req));
      if ((data.projects || []).some((item) => String(item.id) === project.id)) throw new HttpError(409, "A project with this id already exists.");
      const projects = validateProjectCollection([project, ...(data.projects || [])]);
      await writeData({ ...data, projects });
      return send(res, 201, { project: projects.find((item) => item.id === project.id), projects });
    }

    if (url.pathname === "/api/projects/order" && req.method === "PUT") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const data = await readData();
      const { ids } = await readBody(req);
      const current = data.projects || [];
      if (!Array.isArray(ids) || ids.length !== current.length || new Set(ids.map(String)).size !== current.length) throw new HttpError(400, "Ordering must include every project id exactly once.");
      const byId = new Map(current.map((project) => [String(project.id), project]));
      if (ids.some((id) => !byId.has(String(id)))) throw new HttpError(400, "Ordering contains an unknown project id.");
      const projects = validateProjectCollection(ids.map((id) => byId.get(String(id))));
      await writeData({ ...data, projects });
      return send(res, 200, { projects });
    }

    if (url.pathname.startsWith("/api/projects/") && (req.method === "PATCH" || req.method === "PUT")) {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const id = decodeURIComponent(url.pathname.slice("/api/projects/".length));
      const data = await readData();
      const index = (data.projects || []).findIndex((project) => String(project.id) === id);
      if (index < 0) throw new HttpError(404, "Project not found.");
      const body = await readBody(req);
      if (body.id && String(body.id) !== id) throw new HttpError(400, "Project id cannot be changed.");
      const updated = validateProject({ ...body, id }, data.projects[index]);
      const next = [...data.projects];
      next[index] = updated;
      const projects = validateProjectCollection(next);
      await writeData({ ...data, projects });
      return send(res, 200, { project: projects[index], projects });
    }

    if (url.pathname.startsWith("/api/projects/") && req.method === "DELETE") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const id = decodeURIComponent(url.pathname.slice("/api/projects/".length));
      const data = await readData();
      if (!(data.projects || []).some((project) => String(project.id) === id)) throw new HttpError(404, "Project not found.");
      const projects = validateProjectCollection((data.projects || []).filter((project) => String(project.id) !== id));
      await writeData({ ...data, projects });
      return send(res, 200, { ok: true, projects });
    }

    if (url.pathname === "/api/data" && req.method === "GET") {
      return send(res, 200, await readData(), { "Cache-Control": "no-store" });
    }

    if (url.pathname === "/api/data" && req.method === "PUT") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const data = await readBody(req);
      if (Object.prototype.hasOwnProperty.call(data, "projects")) data.projects = validateProjectCollection(data.projects);
      if (Object.prototype.hasOwnProperty.call(data, "achievements")) data.achievements = validateAchievementCollection(data.achievements);
      if (Object.prototype.hasOwnProperty.call(data, "skills")) data.skills = validateSkillCollection(data.skills);
      await writeData(data);
      return send(res, 200, await readData(), { "Cache-Control": "no-store" });
    }

    if (url.pathname === "/api/chat/stream" && req.method === "POST") {
      const body = await readBody(req, { limitBytes: 1 * MB });
      await streamPublicAssistantReply(req, res, body.messages, body.message);
      return;
    }

    if (url.pathname === "/api/chat" && req.method === "POST") {
      const body = await readBody(req, { limitBytes: 1 * MB });
      const reply = await createPublicAssistantReply(req, body.messages, body.message);
      return send(res, 200, { reply });
    }

    if (url.pathname === "/api/uploads/sign" && req.method === "POST") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const file = await readBody(req, { limitBytes: 32 * 1024 });
      return send(res, 201, await createSignedUpload(file), { "Cache-Control": "no-store" });
    }

    if (url.pathname === "/api/uploads" && req.method === "POST") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const body = await readBody(req, { limitBytes: UPLOAD_BODY_LIMIT });
      const files = Array.isArray(body.files) ? body.files : [body];
      const uploads = [];

      for (const file of files) {
        uploads.push(await saveUpload(file));
      }

      return send(res, 201, { uploads });
    }

    if (url.pathname === "/api/reset" && req.method === "POST") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      await writeData(defaultData);
      return send(res, 200, await readData());
    }

    if (url.pathname === "/api/messages" && req.method === "POST") {
      const body = await readBody(req);
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim();
      const subject = String(body.subject || "").trim();
      const message = String(body.message || "").trim();
      const projectType = String(body.projectType || "").trim();

      if (!name || !email || !subject || !message) {
        return send(res, 400, { message: "Name, email, subject, and message are required." });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        return send(res, 400, { message: "Please enter a valid email address." });
      }
      if (name.length > 120 || subject.length > 180 || projectType.length > 100 || message.length > 10000) {
        return send(res, 400, { message: "One or more fields exceed the allowed length." });
      }

      await emailContactMessage({ name, email, projectType, subject, message });

      const messages = await readMessages();
      const entry = {
        id: randomBytes(10).toString("hex"),
        name,
        email,
        projectType,
        subject,
        message,
        preview: message,
        initials: initialsFor(name),
        status: "Unread",
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] || "",
        createdAt: new Date().toISOString(),
        emailedAt: new Date().toISOString(),
      };

      messages.unshift(entry);
      await writeMessages(messages);
      return send(res, 201, entry);
    }

    if (url.pathname === "/api/messages" && req.method === "GET") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      return send(res, 200, await readMessages());
    }

    if (url.pathname.startsWith("/api/messages/") && req.method === "PATCH") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const id = decodeURIComponent(url.pathname.replace("/api/messages/", ""));
      const body = await readBody(req);
      const messages = await readMessages();
      const next = messages.map((message) =>
        message.id === id ? { ...message, ...body, updatedAt: new Date().toISOString() } : message
      );
      await writeMessages(next);
      return send(res, 200, next.find((message) => message.id === id));
    }

    if (url.pathname.startsWith("/api/messages/") && req.method === "DELETE") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const id = decodeURIComponent(url.pathname.replace("/api/messages/", ""));
      const messages = await readMessages();
      await writeMessages(messages.filter((message) => message.id !== id));
      return send(res, 200, { ok: true });
    }

    if (url.pathname === "/api/visits" && req.method === "POST") {
      const body = await readBody(req);
      const analytics = await readAnalytics();
      const visit = {
        id: randomBytes(10).toString("hex"),
        visitorId: String(body.visitorId || "").slice(0, 120),
        path: String(body.path || "/").slice(0, 300),
        title: String(body.title || "").slice(0, 200),
        referrer: String(body.referrer || "").slice(0, 500),
        language: String(body.language || "").slice(0, 80),
        screen: String(body.screen || "").slice(0, 80),
        ip: getClientIp(req),
        userAgent: req.headers["user-agent"] || "",
        createdAt: new Date().toISOString(),
      };

      analytics.visits = [visit, ...(analytics.visits || [])].slice(0, 5000);
      await writeAnalytics(analytics);
      return send(res, 201, { ok: true });
    }

    if (url.pathname === "/api/analytics" && req.method === "GET") {
      if (!isAuthed(req)) return send(res, 401, { message: "Unauthorized." });
      const analytics = await readAnalytics();
      return send(res, 200, summarizeAnalytics(analytics.visits || []));
    }

    return send(res, 404, { message: "Not found." });
  } catch (error) {
    const requestId = String(req.headers["x-vercel-id"] || randomBytes(6).toString("hex"));
    const status = error instanceof HttpError ? error.status : 500;
    console.error("[api-error]", { requestId, method: req.method, path: req.url, status, message: error?.message || "Unknown error" });
    return send(
      res,
      status,
      { message: error instanceof HttpError ? error.message : "The server could not complete this request. Please retry.", requestId },
      { "Cache-Control": "no-store" }
    );
  }
}

function validateProductionConfig() {
  if (hasPartialRemoteConfig()) {
    throw new Error("Set both SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or leave both unset for local development.");
  }
  if (REQUIRE_DATABASE && !hasRemotePersistence()) {
    throw new Error(
      "Durable database storage is required. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY after running scripts/supabase-setup.sql."
    );
  }
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error("Production requires explicit ADMIN_USERNAME and a unique ADMIN_PASSWORD of at least 12 characters.");
  }
  if (!process.env.ADMIN_SESSION_SECRET || ADMIN_SESSION_SECRET.length < 32) {
    throw new Error("Production requires ADMIN_SESSION_SECRET with at least 32 random characters.");
  }
  if (!process.env.CORS_ORIGIN || CORS_ORIGIN === "*") {
    throw new Error("Production requires CORS_ORIGIN to match the deployed portfolio origin.");
  }
  let productionOrigin;
  try { productionOrigin = new URL(CORS_ORIGIN); } catch {
    throw new Error("CORS_ORIGIN must be a valid absolute production URL.");
  }
  if (productionOrigin.protocol !== "https:") {
    throw new Error("Production CORS_ORIGIN must use HTTPS.");
  }
  if (SUPABASE_SERVICE_ROLE_KEY && /publishable|anon/i.test(SUPABASE_SERVICE_ROLE_KEY)) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY must be the server-only service role key, never an anon or publishable key.");
  }
  if (!SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error("Production contact delivery requires SMTP_USER, SMTP_PASS, and SMTP_FROM.");
  }
}

validateProductionConfig();

export async function handleVercelRequest(req, res) {
  if (!req.url?.startsWith("/api/")) return send(res, 404, { message: "API route not found." });
  return handleApi(req, res);
}

export async function initializePersistence() {
  if (!hasRemotePersistence()) {
    await ensureDataFile();
    return;
  }

  try {
    await readData();
  } catch (error) {
    if (process.env.NODE_ENV === "production" || REQUIRE_DATABASE) throw error;
    remotePersistenceDisabled = true;
    await ensureDataFile();
    console.warn("Supabase persistence is unavailable in development; using .portfolio-data instead. Run scripts/supabase-setup.sql to enable durable storage.");
  }
}
