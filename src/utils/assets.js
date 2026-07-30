const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN ||
  (typeof window !== "undefined" && ["5173", "4173"].includes(window.location.port)
    ? "http://127.0.0.1:3001"
    : "");

export function assetUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (/^(https?:|data:|blob:|mailto:|tel:)/i.test(url)) return url;
  if (url.startsWith("/uploads/") && API_ORIGIN) return `${API_ORIGIN}${url}`;
  return url;
}
