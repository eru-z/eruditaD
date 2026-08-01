import { handleVercelRequest } from "../server/index.js";

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
  const isInternalCatchAll = parsed.pathname === "/api/[...path]" || parsed.pathname === "/api" || parsed.pathname === "/";

  if (catchAll.length && isInternalCatchAll) {
    parsed.pathname = `/api/${catchAll.map(encodeURIComponent).join("/")}`;
  } else if (!parsed.pathname.startsWith("/api/") && catchAll.length) {
    parsed.pathname = `/api/${catchAll.map(encodeURIComponent).join("/")}`;
  }

  return `${parsed.pathname}${parsed.search}`;
}

export default async function handler(request, response) {
  request.url = normalizeVercelApiUrl(request);
  return handleVercelRequest(request, response);
}
