import { useEffect, useState, useCallback } from "react";
import { defaultData } from "../data/defaultData.js";

const KEY = "erudita_portfolio_v1";
const AUTH_KEY = "erudita_admin_token";
const VISITOR_KEY = "erudita_visitor_id";
const AUTH_REQUIRED_EVENT = "erudita:auth-required";
const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  (typeof window !== "undefined" && window.location.port === "4173" ? "http://127.0.0.1:3001" : "");

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
  const [data, setData] = useState(loadData);

  useEffect(() => {
    let alive = true;
    fetchData()
      .then((fresh) => {
        if (alive) setData(fresh);
      })
      .catch(() => {
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
      saveData(next).catch((error) => console.error(error));
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

  return response.json();
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

  return response.json();
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

  return response.json();
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
  const payload = await Promise.all(Array.from(files || []).map(fileToPayload));
  if (!payload.length) return [];

  const response = await apiFetch("/api/uploads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requireToken()}`,
    },
    body: JSON.stringify({ files: payload }),
  });

  if (!response.ok) {
    if (response.status === 401) expireSession();
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || "Could not upload media.");
  }

  const body = await response.json();
  return body.uploads || [];
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
    if (!API_ORIGIN && response.status === 404 && path.startsWith("/api/")) {
      return fetch(`http://127.0.0.1:3001${path}`, options);
    }
    return response;
  } catch (error) {
    if (!API_ORIGIN && path.startsWith("/api/")) {
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
