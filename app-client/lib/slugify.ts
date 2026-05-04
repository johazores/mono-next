/**
 * Generate a URL-friendly slug from a string.
 * Mirrors the server-side logic in content-item-service / taxonomy-service.
 */
export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "untitled"
  );
}
