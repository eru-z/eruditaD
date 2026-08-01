import { useEffect, useState, useCallback } from "react";
import { defaultData } from "../data/defaultData.js";

const KEY = "erudita_portfolio_v1";
const AUTH_KEY = "erudita_admin_token";
const VISITOR_KEY = "erudita_visitor_id";
const AUTH_REQUIRED_EVENT = "erudita:auth-required";
const IS_DEVELOPMENT = Boolean(import.meta.env?.DEV);
const API_ORIGIN =
  import.meta.env?.VITE_API_ORIGIN ||
  (IS_DEVELOPMENT && typeof window !== "undefined" && ["5173", "4173"].includes(window.location.port)
    ? "http://127.0.0.1:3001"
    : "");
const cloneDefault = () => structuredClone(defaultData);

function mergeData(data) {
  const defaults = cloneDefault();
  const incoming = data || {};
  return {
    ...defaults,
    ...incoming,
    profile: { ...defaults.profile, ...(incoming.profile || {}) },
    contact: { ...defaults.contact, ...(incoming.contact || {}) },
    achievements: {
      ...(defaults.achievements || {}),
      ...(incoming.achievements || {}),
      recognitions:
        incoming.achievements?.recognitions || defaults.achievements?.recognitions || [],
      certificates:
        incoming.achievements?.certificates || defaults.achievements?.certificates || [],
      clients: incoming.achievements?.clients || defaults.achievements?.clients || [],
    },
    resume: { ...(defaults.resume || {}), ...(incoming.resume || {}) },
  };
}

export function loadData() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return cloneDefault();
    return mergeData(JSON.parse(raw));
  } catch {
    return cloneDefault();
  }
}

export function saveData(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("erudita:data"));
  return persistData(data);
}

export async function savePortfolioData(data) {
  requireToken();
  const saved = await persistData(data);
  const next = saved || data;
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("erudita:data"));
  return next;
}

async function persistData(data) {
  const token = requireToken();

  const response = await apiFetch("/api/data", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) expireSession();
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Could not save portfolio data.");
  }

  const saved = await response.json();
  localStorage.setItem(KEY, JSON.stringify(saved));
  window.dispatchEvent(new Event("erudita:data"));
  return saved;
}

function cacheProjects(projects) {
  const next = mergeData({ ...loadData(), projects });
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("erudita:data"));
  return projects;
}

async function projectRequest(path, options = {}) {
  const token = requireToken();
  const response = await apiFetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) expireSession();
    throw new Error(body.message || "Could not update projects.");
  }
  if (Array.isArray(body.projects)) cacheProjects(body.projects);
  return body;
}

export async function fetchAdminProjects() {
  const body = await projectRequest("/api/projects?includeDrafts=1");
  return body.projects || [];
}

export function createProjectRecord(project) {
  return projectRequest("/api/projects", { method: "POST", body: JSON.stringify(project) });
}

export function updateProjectRecord(id, updates) {
  return projectRequest(`/api/projects/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(updates) });
}

export function deleteProjectRecord(id) {
  return projectRequest(`/api/projects/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function reorderProjectRecords(ids) {
  return projectRequest("/api/projects/order", { method: "PUT", body: JSON.stringify({ ids }) });
}
export async function fetchData() {
  const response = await apiFetch("/api/data");
  if (!response.ok) throw new Error("Could not load portfolio data.");
  const data = mergeData(await response.json());
  localStorage.setItem(KEY, JSON.stringify(data));
  window.dispatchEvent(new Event("erudita:data"));
  return data;
}

export function resetData() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("erudita:data"));

  const token = getToken();
  if (!token) return Promise.resolve(cloneDefault());

  return apiFetch("/api/reset", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((response) => {
      if (!response.ok) throw new Error("Could not reset data.");
      return response.json();
    })
    .then((data) => {
      localStorage.setItem(KEY, JSON.stringify(data));
      window.dispatchEvent(new Event("erudita:data"));
      return data;
    });
}

export function useData() {
  // Start with the last successful admin/API snapshot so saved project media
  // never flashes back to the bundled logo-only defaults during page load.
  const [data, setData] = useState(loadData);

  useEffect(() => {
    let alive = true;
    fetchData()
      .then((fresh) => {
        if (alive) setData(fresh);
      })
      .catch(() => {
        // A temporary API failure must not discard valid cached admin data.
        if (alive) setData(loadData());
      });

    const handler = () => setData(loadData());
    window.addEventListener("erudita:data", handler);
    window.addEventListener("storage", handler);
    return () => {
      alive = false;
      window.removeEventListener("erudita:data", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const update = useCallback((updater) => {
    setData((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      localStorage.setItem(KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("erudita:data"));
      persistData(next).catch((error) => {
        localStorage.setItem(KEY, JSON.stringify(prev));
        setData(prev);
        window.dispatchEvent(new Event("erudita:data"));
        window.dispatchEvent(new CustomEvent('erudita:save-error', { detail: error?.message || 'Could not save changes.' }));
      });
      return next;
    });
  }, []);

  return [data, update];
}

export async function login(username, password) {
  const response = await apiFetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) return false;

  const { token } = await response.json();
  localStorage.setItem(AUTH_KEY, token);
  return true;
}

export function logout() {
  const token = getToken();
  localStorage.removeItem(AUTH_KEY);
  if (token) {
    apiFetch("/api/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
}

export function isAuthed() {
  return Boolean(getToken());
}

export async function validateAdminSession() {
  const token = getToken();
  if (!token) return false;

  try {
    const response = await apiFetch("/api/session", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) return true;
  } catch {
    return false;
  }

  expireSession();
  return false;
}

export async function sendContactMessage(message) {
  const response = await apiFetch("/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Could not send message.");
  }
  const saved = await response.json();
  window.dispatchEvent(new Event("erudita:messages"));
  return saved;
}

export async function sendAssistantMessage(messages, message = "") {
  const response = await apiFetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, message }),
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.message || "Could not reach the portfolio assistant.");
  }

  return body.reply || "";
}

export async function streamAssistantMessage(messages, message = "", onChunk = () => {}, signal) {
  const response = await apiFetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, message }),
    signal,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Could not reach the portfolio assistant.");
  }

  if (!response.body) {
    const text = await response.text();
    onChunk(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    if (!chunk) continue;
    fullText += chunk;
    onChunk(chunk, fullText);
  }

  const tail = decoder.decode();
  if (tail) {
    fullText += tail;
    onChunk(tail, fullText);
  }

  return fullText;
}

export async function fetchMessages() {
  const response = await apiFetch("/api/messages", {
    headers: { Authorization: `Bearer ${requireToken()}` },
  });

  if (!response.ok) {
    if (response.status === 401) expireSession();
    throw new Error("Could not load messages.");
  }

  return response.json();
}

export async function updateMessage(id, patch) {
  const response = await apiFetch(`/api/messages/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireToken()}`,
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    if (response.status === 401) expireSession();
    throw new Error("Could not update message.");
  }
  const updated = await response.json();
  window.dispatchEvent(new Event("erudita:messages"));
  return updated;
}

export async function deleteMessage(id) {
  const response = await apiFetch(`/api/messages/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${requireToken()}` },
  });

  if (!response.ok) {
    if (response.status === 401) expireSession();
    throw new Error("Could not delete message.");
  }
  const deleted = await response.json();
  window.dispatchEvent(new Event("erudita:messages"));
  return deleted;
}

export async function fetchAnalytics() {
  const response = await apiFetch("/api/analytics", {
    headers: { Authorization: `Bearer ${requireToken()}` },
  });

  if (!response.ok) {
    if (response.status === 401) expireSession();
    throw new Error("Could not load analytics.");
  }

  return response.json();
}

export async function uploadMediaFiles(files) {
  const selectedFiles = Array.from(files || []);
  if (!selectedFiles.length) return [];
  const token = requireToken();
  const uploaded = [];

  for (const file of selectedFiles) {
    const authorization = await apiFetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
    });

    if (!authorization.ok) {
      if (authorization.status === 401) expireSession();
      if (IS_DEVELOPMENT && authorization.status === 503) return uploadMediaFilesThroughLocalBackend(selectedFiles, token);
      const body = await authorization.json().catch(() => ({}));
      throw new Error(body.message || `Could not authorize ${file.name}.`);
    }

    const signed = await authorization.json();
    const form = new FormData();
    form.append("cacheControl", "31536000");
    form.append("", file);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 120000);
    try {
      const response = await fetch(signed.signedUrl, {
        method: "PUT",
        headers: { "x-upsert": "false" },
        body: form,
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Upload failed for ${file.name} (${response.status}).`);
      uploaded.push(signed.upload);
    } catch (error) {
      if (error?.name === "AbortError") throw new Error(`Upload timed out for ${file.name}. Please retry.`, { cause: error });
      throw error;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  return uploaded;
}

async function uploadMediaFilesThroughLocalBackend(files, token) {
  const payload = await Promise.all(files.map(fileToPayload));
  const response = await apiFetch("/api/uploads", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ files: payload }),
  });
  if (!response.ok) {
    if (response.status === 401) expireSession();
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Could not upload media.");
  }
  return (await response.json()).uploads || [];
}
export function trackVisit({ path, title, referrer } = {}) {
  let visitorId = localStorage.getItem(VISITOR_KEY);
  if (!visitorId) {
    visitorId = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(VISITOR_KEY, visitorId);
  }

  const payload = {
    visitorId,
    path: path || `${window.location.pathname}${window.location.hash}`,
    title: title || document.title,
    referrer: referrer || document.referrer,
    language: navigator.language,
    screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
  };

  const body = JSON.stringify(payload);
  if (navigator.sendBeacon) {
    navigator.sendBeacon(apiUrl("/api/visits"), new Blob([body], { type: "application/json" }));
    return;
  }

  apiFetch("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {});
}

function getToken() {
  return localStorage.getItem(AUTH_KEY);
}

function requireToken() {
  const token = getToken();
  if (token) return token;
  expireSession();
  throw new Error("Your admin session expired. Sign in again to save changes.");
}

function expireSession() {
  localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new Event(AUTH_REQUIRED_EVENT));
}

function apiUrl(path) {
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path}`;
}

async function apiFetch(path, options) {
  const target = apiUrl(path);

  try {
    const response = await fetch(target, options);
    if (IS_DEVELOPMENT && !API_ORIGIN && response.status === 404 && path.startsWith("/api/")) {
      return fetch(`http://127.0.0.1:3001${path}`, options);
    }
    return response;
  } catch (error) {
    if (IS_DEVELOPMENT && !API_ORIGIN && path.startsWith("/api/")) {
      return fetch(`http://127.0.0.1:3001${path}`, options);
    }
    throw error;
  }
}

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        name: file.name,
        type: file.type,
        dataUrl: reader.result,
      });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
