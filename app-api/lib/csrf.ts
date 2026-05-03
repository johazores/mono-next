import type { NextApiRequest, NextApiResponse } from "next";
import { sendError } from "@/lib/api-response";

const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:7000";

/**
 * Validates that state-changing requests (POST, PUT, DELETE) originate from
 * the expected client origin. Checks the Origin header first, then falls back
 * to the Referer header.
 *
 * This is defense-in-depth alongside SameSite=Lax cookies and CORS.
 * In development mode, the check is relaxed for tools like curl and Postman.
 */
export function verifyCsrf(req: NextApiRequest, res: NextApiResponse): boolean {
  // Only check state-changing methods
  if (!req.method || ["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return true;
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // Allow requests with matching Origin header
  if (origin) {
    if (origin === clientOrigin) return true;
    sendError(res, "Request origin not allowed.", 403);
    return false;
  }

  // Fall back to Referer header
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin === clientOrigin) return true;
    } catch {
      // Invalid referer URL
    }
    sendError(res, "Request origin not allowed.", 403);
    return false;
  }

  // In development, allow requests without Origin/Referer (curl, Postman)
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  sendError(res, "Request origin not allowed.", 403);
  return false;
}
