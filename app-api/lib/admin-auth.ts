import type { NextApiRequest, NextApiResponse } from "next";
import { sendError } from "@/lib/api-response";
import type { Role, AuthSession } from "@/types";

export type { AuthUser, AuthSession } from "@/types";

export async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles?: Role[],
): Promise<AuthSession | null> {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    sendError(res, "Authentication required.", 401);
    return null;
  }

  // TODO: Replace with real token/session validation (e.g. JWT verify or DB session lookup)
  // For now, reject all requests until auth is implemented.
  sendError(res, "Auth not configured. Implement session validation.", 501);
  return null;
}
