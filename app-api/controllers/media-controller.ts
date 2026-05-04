import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { mediaService } from "@/services/media-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function mediaCollectionController(
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
    const items = await mediaService.list();
    return sendOk(res, { items });
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    try {
      const item = await mediaService.create(req.body);
      await logActivity(req, "media.create", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "media",
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

export async function mediaItemController(
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
    const item = await mediaService.getById(id);
    if (!item) return sendError(res, "Media not found.", 404);
    return sendOk(res, item);
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "DELETE") {
    try {
      await mediaService.delete(id);
      await logActivity(req, "media.delete", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "media",
        resourceId: id,
      });
      return sendOk(res, { deleted: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  return sendError(res, "Method not allowed.", 405);
}

/** Serve base64 media file inline. */
export async function mediaFileController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return sendError(res, "Method not allowed.", 405);
  }

  const id = String(req.query.id || "");
  const item = await mediaService.getById(id);

  if (!item || !item.base64Data) {
    return sendError(res, "File not found.", 404);
  }

  const buffer = Buffer.from(item.base64Data, "base64");
  res.setHeader("Content-Type", item.mimeType || "application/octet-stream");
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.status(200).end(buffer);
}
