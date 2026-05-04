import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { blockTemplateService } from "@/services/block-template-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function blockTemplateCollectionController(
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
    const items = await blockTemplateService.list();
    return sendOk(res, { items });
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    try {
      const template = await blockTemplateService.create(req.body);
      await logActivity(req, "block-template.create", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "block-template",
        resourceId: template.id,
      });
      return sendOk(res, template, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return sendError(res, "Method not allowed.", 405);
}

export async function blockTemplateItemController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const id = req.query.id as string;

  if (req.method === "GET") {
    try {
      const template = await blockTemplateService.getById(id);
      return sendOk(res, template);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Not found.";
      return sendError(res, message, 404);
    }
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "PUT") {
    try {
      const template = await blockTemplateService.update(id, req.body);
      await logActivity(req, "block-template.update", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "block-template",
        resourceId: template.id,
      });
      return sendOk(res, template);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  if (req.method === "DELETE") {
    try {
      await blockTemplateService.delete(id);
      await logActivity(req, "block-template.delete", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "block-template",
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

/** Public endpoint — returns only active templates (no auth required) */
export async function publicBlockTemplateController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    const items = await blockTemplateService.listActive();
    return sendOk(res, { items });
  }

  res.setHeader("Allow", ["GET"]);
  return sendError(res, "Method not allowed.", 405);
}
