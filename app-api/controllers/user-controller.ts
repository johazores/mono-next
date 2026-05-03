import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { userService } from "@/services/user-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function userCollectionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  const session = await requireAdmin(req, res, ["admin"]);
  if (!session) return;

  try {
    if (req.method === "GET")
      return sendOk(res, { items: await userService.list() });
    if (req.method === "POST") {
      if (!verifyCsrf(req, res)) return;
      const user = await userService.register(req.body);
      await logActivity(req, "user.create", {
        resource: "user",
        resourceId: user?.id,
        metadata: { email: user?.email },
      });
      return sendOk(res, user, 201);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return sendError(res, "Method not allowed.", 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return sendError(res, message, 400);
  }
}

export async function userItemController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  const session = await requireAdmin(req, res, ["admin"]);
  if (!session) return;

  const id = String(req.query.id || "");

  try {
    if (req.method === "GET") {
      const item = await userService.getById(id);
      if (!item) return sendError(res, "User not found.", 404);
      return sendOk(res, item);
    }

    if (req.method === "PUT") {
      if (!verifyCsrf(req, res)) return;
      const user = await userService.update(id, req.body);
      await logActivity(req, "user.update", {
        resource: "user",
        resourceId: id,
        metadata: { fields: Object.keys(req.body || {}) },
      });
      return sendOk(res, user);
    }

    if (req.method === "DELETE") {
      if (!verifyCsrf(req, res)) return;
      const user = await userService.delete(id);
      await logActivity(req, "user.delete", {
        resource: "user",
        resourceId: id,
        metadata: { email: user?.email },
      });
      return sendOk(res, user);
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return sendError(res, "Method not allowed.", 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return sendError(res, message, 400);
  }
}
