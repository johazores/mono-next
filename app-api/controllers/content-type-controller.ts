import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { contentTypeService } from "@/services/content-type-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function contentTypeCollectionController(
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
    const items = await contentTypeService.list();
    return sendOk(res, { items });
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    try {
      const contentType = await contentTypeService.create(req.body);
      await logActivity(req, "content-type.create", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "content-type",
        resourceId: contentType.id,
      });
      return sendOk(res, contentType, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return sendError(res, "Method not allowed.", 405);
}

export async function contentTypeItemController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const id = String(req.query.id || "");

  if (req.method === "GET") {
    const contentType = await contentTypeService.getById(id);
    if (!contentType) return sendError(res, "Content type not found.", 404);
    return sendOk(res, contentType);
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "PUT") {
    try {
      const contentType = await contentTypeService.update(id, req.body);
      await logActivity(req, "content-type.update", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "content-type",
        resourceId: id,
      });
      return sendOk(res, contentType);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  if (req.method === "DELETE") {
    try {
      await contentTypeService.delete(id);
      await logActivity(req, "content-type.delete", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "content-type",
        resourceId: id,
      });
      return sendOk(res, { deleted: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return sendError(res, "Method not allowed.", 405);
}
