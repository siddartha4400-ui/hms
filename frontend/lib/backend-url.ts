export function getBackendBaseUrl(): string {
  const explicitBase = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (explicitBase) {
    return explicitBase.replace(/\/$/, "");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl) {
    return apiUrl.replace(/\/graphql\/?$/, "").replace(/\/$/, "");
  }

  return "http://localhost:8000";
}

export function normalizeBackendAssetUrl(url?: string | null): string {
  const rawUrl = (url || "").trim();
  if (!rawUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const base = getBackendBaseUrl();
  return `${base}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}
