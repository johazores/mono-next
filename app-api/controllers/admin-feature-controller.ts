import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { featureRepository } from "@/repositories/feature-repository";
import { invalidateFeatureCache } from "@/lib/feature-registry";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

const KEY_REGEX = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export async function adminFeatureCollectionController(
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
    const items = await featureRepository.listAll();
    return sendOk(res, { items });
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    const { key, description, category, sortOrder } = req.body || {};

    if (!key || !description || !category) {
      return sendError(
        res,
        "key, description, and category are required.",
        400,
      );
    }

    const cleanKey = String(key).toLowerCase().trim();
    if (!KEY_REGEX.test(cleanKey) || cleanKey.length > 50) {
      return sendError(
        res,
        "Key must be lowercase alphanumeric with dots/hyphens, max 50 chars.",
        400,
      );
    }

    const existing = await featureRepository.findByKey(cleanKey);
    if (existing) {
      return sendError(res, "A feature with this key already exists.", 409);
    }

    try {
      const feature = await featureRepository.create({
        key: cleanKey,
        description: String(description).trim(),
        category: String(category).trim(),
        sortOrder: typeof sortOrder === "number" ? sortOrder : 0,
      });
      invalidateFeatureCache();

      await logActivity(req, "feature.create", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "feature",
        resourceId: feature.id,
      });

      return sendOk(res, feature, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return sendError(res, "Method not allowed.", 405);
}

export async function adminFeatureItemController(
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
    const feature = await featureRepository.findById(id);
    if (!feature) return sendError(res, "Feature not found.", 404);
    return sendOk(res, feature);
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "PUT") {
    const current = await featureRepository.findById(id);
    if (!current) return sendError(res, "Feature not found.", 404);

    const { key, description, category, isActive, sortOrder } = req.body || {};
    const data: Record<string, unknown> = {};

    if (key !== undefined) {
      const cleanKey = String(key).toLowerCase().trim();
      if (!KEY_REGEX.test(cleanKey) || cleanKey.length > 50) {
        return sendError(
          res,
          "Key must be lowercase alphanumeric with dots/hyphens, max 50 chars.",
          400,
        );
      }
      if (cleanKey !== current.key) {
        const existing = await featureRepository.findByKey(cleanKey);
        if (existing)
          return sendError(res, "A feature with this key already exists.", 409);
      }
      data.key = cleanKey;
    }
    if (description !== undefined)
      data.description = String(description).trim();
    if (category !== undefined) data.category = String(category).trim();
    if (typeof isActive === "boolean") data.isActive = isActive;
    if (typeof sortOrder === "number") data.sortOrder = sortOrder;

    if (Object.keys(data).length === 0) {
      return sendError(res, "No fields to update.", 400);
    }

    try {
      const feature = await featureRepository.update(id, data as never);
      invalidateFeatureCache();

      await logActivity(req, "feature.update", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "feature",
        resourceId: id,
      });

      return sendOk(res, feature);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  if (req.method === "DELETE") {
    const current = await featureRepository.findById(id);
    if (!current) return sendError(res, "Feature not found.", 404);

    try {
      await featureRepository.delete(id);
      invalidateFeatureCache();

      await logActivity(req, "feature.delete", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "feature",
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
