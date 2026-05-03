import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { requireUser } from "@/lib/user-auth";
import { sendOk, sendError } from "@/lib/api-response";
import { adminService } from "@/services/admin-service";
import { userService } from "@/services/user-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function adminProfileController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === "GET") {
    const admin = await adminService.getById(session.admin.id);
    if (!admin) {
      sendError(res, "Admin not found.", 404);
      return;
    }
    sendOk(res, admin);
    return;
  }

  if (req.method === "PUT") {
    if (!verifyCsrf(req, res)) return;
    try {
      const admin = await adminService.updateProfile(
        session.admin.id,
        req.body,
      );
      await logActivity(req, "profile.update", {
        resource: "admin",
        resourceId: session.admin.id,
        metadata: {
          fields: Object.keys(req.body || {}).filter(
            (k) => k !== "currentPassword" && k !== "newPassword",
          ),
        },
      });
      sendOk(res, admin);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed.";
      sendError(res, message, 400);
    }
    return;
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  sendError(res, "Method not allowed.", 405);
}

export async function userProfileController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireUser(req, res);
  if (!session) return;

  if (req.method === "GET") {
    const user = await userService.getById(session.user.id);
    if (!user) {
      sendError(res, "User not found.", 404);
      return;
    }
    sendOk(res, user);
    return;
  }

  if (req.method === "PUT") {
    if (!verifyCsrf(req, res)) return;
    try {
      const user = await userService.updateProfile(session.user.id, req.body);
      await logActivity(req, "profile.update", {
        resource: "user",
        resourceId: session.user.id,
        metadata: {
          fields: Object.keys(req.body || {}).filter(
            (k) => k !== "currentPassword" && k !== "newPassword",
          ),
        },
      });
      sendOk(res, user);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed.";
      sendError(res, message, 400);
    }
    return;
  }

  res.setHeader("Allow", ["GET", "PUT"]);
  sendError(res, "Method not allowed.", 405);
}
