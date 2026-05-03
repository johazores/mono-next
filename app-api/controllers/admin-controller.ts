import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { adminService } from "@/services/admin-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function adminCollectionController(
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
      return sendOk(res, { items: await adminService.list() });
    if (req.method === "POST") {
      if (!verifyCsrf(req, res)) return;
      const admin = await adminService.create(req.body);
      await logActivity(req, "admin.create", {
        resource: "admin",
        resourceId: admin?.id,
        metadata: { email: admin?.email },
      });
      return sendOk(res, admin, 201);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return sendError(res, "Method not allowed.", 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return sendError(res, message, 400);
  }
}

export async function adminItemController(
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
      const item = await adminService.getById(id);
      if (!item) return sendError(res, "Admin not found.", 404);
      return sendOk(res, item);
    }

    if (req.method === "PUT") {
      if (!verifyCsrf(req, res)) return;
      const admin = await adminService.update(id, req.body);
      await logActivity(req, "admin.update", {
        resource: "admin",
        resourceId: id,
        metadata: { fields: Object.keys(req.body || {}) },
      });
      return sendOk(res, admin);
    }

    if (req.method === "DELETE") {
      if (!verifyCsrf(req, res)) return;
      const admin = await adminService.delete(id);
      await logActivity(req, "admin.delete", {
        resource: "admin",
        resourceId: id,
        metadata: { email: admin?.email },
      });
      return sendOk(res, admin);
    }

    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return sendError(res, "Method not allowed.", 405);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return sendError(res, message, 400);
  }
}
