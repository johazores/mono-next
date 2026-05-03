import type { NextApiRequest, NextApiResponse } from "next";
import { sendOk, sendError } from "@/lib/api-response";
import {
  createAdminSession,
  clearAdminSession,
  getAuthSession,
} from "@/lib/admin-auth";
import { adminService } from "@/services/admin-service";

export async function loginController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    sendError(res, "Method not allowed.", 405);
    return;
  }

  try {
    const { email, password } = req.body ?? {};
    const admin = await adminService.authenticate(email, password);
    await createAdminSession(admin.id, res);
    sendOk(res, admin);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed.";
    sendError(res, message, 401);
  }
}

export async function logoutController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") {
    sendError(res, "Method not allowed.", 405);
    return;
  }

  await clearAdminSession(req, res);
  sendOk(res, null);
}

export async function meController(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    sendError(res, "Method not allowed.", 405);
    return;
  }

  const session = await getAuthSession(req);
  if (!session) {
    sendError(res, "Not authenticated.", 401);
    return;
  }

  sendOk(res, session.admin);
}
