const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Resolve a media URL stored in the database.
 * Relative paths like `/api/cms/media/xxx/file` are prefixed with the API
 * origin so that `<img src>` loads from the correct server.
 */
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE}${url}`;
}
