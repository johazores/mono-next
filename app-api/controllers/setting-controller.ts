import type { NextApiRequest, NextApiResponse } from "next";
import { sendOk, sendError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin-auth";
import { settingService } from "@/services/setting-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function settingCollectionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res, ["admin"]);
  if (!session) return;

  if (req.method === "GET") {
    const settings = await settingService.getAll();
    return sendOk(res, { items: settings });
  }

  return sendError(res, "Method not allowed.", 405);
}

export async function settingItemController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res, ["admin"]);
  if (!session) return;

  const key = req.query.key as string;
  if (!key) {
    return sendError(res, "Setting key is required.", 400);
  }

  if (req.method === "GET") {
    const value = await settingService.get(key);
    return sendOk(res, { key, value });
  }

  if (req.method === "PUT") {
    if (!verifyCsrf(req, res)) return;

    const { value } = req.body ?? {};
    if (value === undefined) {
      return sendError(res, "Value is required.", 400);
    }

    try {
      await settingService.set(key, value);
      await logActivity(req, "setting.update", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "setting",
        metadata: { key },
      });
      const updated = await settingService.get(key);
      return sendOk(res, { key, value: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  return sendError(res, "Method not allowed.", 405);
}

export async function publicAuthConfigController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    return sendError(res, "Method not allowed.", 405);
  }

  const config = await settingService.getPublicAuthConfig();
  sendOk(res, config);
}

export async function publicPaymentConfigController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    return sendError(res, "Method not allowed.", 405);
  }

  const config = await settingService.getPublicPaymentConfig();
  sendOk(res, config);
}
