import { handleVercelRequest } from "./index.js";

function routeSegments(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];
  return values
    .flatMap((segment) => String(segment).split("/"))
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function normalizeVercelApiUrl(request) {
  const parsed = new URL(request?.url || "/", "http://vercel.local");
  const catchAll = routeSegments(request?.query?.path);
  const internalPaths = new Set(["/api/[...path]", "/api/route", "/api", "/"]);

  if (catchAll.length && (internalPaths.has(parsed.pathname) || !parsed.pathname.startsWith("/api/"))) {
    parsed.pathname = `/api/${catchAll.map(encodeURIComponent).join("/")}`;
  }

  return `${parsed.pathname}${parsed.search}`;
}

export async function handleVercelApiRequest(request, response) {
  request.url = normalizeVercelApiUrl(request);
  return handleVercelRequest(request, response);
}
