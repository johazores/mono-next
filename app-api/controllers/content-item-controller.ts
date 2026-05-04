import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { contentItemService } from "@/services/content-item-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function contentItemCollectionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const typeSlug = String(req.query.typeSlug || "");

  if (req.method === "GET") {
    const items = await contentItemService.listByType(typeSlug);
    return sendOk(res, { items });
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    try {
      const item = await contentItemService.create(typeSlug, req.body);
      await logActivity(req, "content.create", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: typeSlug,
        resourceId: item.id,
      });
      return sendOk(res, item, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return sendError(res, "Method not allowed.", 405);
}

export async function contentItemItemController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const typeSlug = String(req.query.typeSlug || "");
  const id = String(req.query.id || "");

  if (req.method === "GET") {
    const item = await contentItemService.getById(id);
    if (!item) return sendError(res, "Content item not found.", 404);
    return sendOk(res, item);
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "PUT") {
    try {
      const item = await contentItemService.update(id, typeSlug, req.body);
      await logActivity(req, "content.update", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: typeSlug,
        resourceId: id,
      });
      return sendOk(res, item);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  if (req.method === "DELETE") {
    try {
      await contentItemService.delete(id);
      await logActivity(req, "content.delete", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: typeSlug,
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
