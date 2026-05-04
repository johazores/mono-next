import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { pageService } from "@/services/page-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function pageCollectionController(
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
    const items = await pageService.list();
    return sendOk(res, { items });
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    try {
      const page = await pageService.create(req.body);
      await logActivity(req, "page.create", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "page",
        resourceId: page.id,
      });
      return sendOk(res, page, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return sendError(res, "Method not allowed.", 405);
}

export async function pageItemController(
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
    const page = await pageService.getById(id);
    if (!page) return sendError(res, "Page not found.", 404);
    return sendOk(res, page);
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "PUT") {
    try {
      const page = await pageService.update(id, req.body);
      await logActivity(req, "page.update", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "page",
        resourceId: id,
      });
      return sendOk(res, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  if (req.method === "DELETE") {
    try {
      await pageService.delete(id);
      await logActivity(req, "page.delete", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "page",
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
