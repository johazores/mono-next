import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { planService } from "@/services/plan-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function planCollectionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // GET is public (returns active plans only)
  if (req.method === "GET") {
    const items = await planService.list();
    return sendOk(res, { items });
  }

  // POST requires admin
  const session = await requireAdmin(req, res, ["admin"]);
  if (!session) return;

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    try {
      const plan = await planService.create(req.body);
      await logActivity(req, "plan.create", {
        resource: "plan",
        resourceId: plan.id,
        metadata: { slug: plan.slug },
      });
      return sendOk(res, plan, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return sendError(res, "Method not allowed.", 405);
}

export async function planItemController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const id = String(req.query.id || "");

  // GET is public
  if (req.method === "GET") {
    const plan = await planService.getById(id);
    if (!plan) return sendError(res, "Plan not found.", 404);
    return sendOk(res, plan);
  }

  // PUT/DELETE require admin
  const session = await requireAdmin(req, res, ["admin"]);
  if (!session) return;

  if (!verifyCsrf(req, res)) return;

  try {
    if (req.method === "PUT") {
      const plan = await planService.update(id, req.body);
      await logActivity(req, "plan.update", {
        resource: "plan",
        resourceId: id,
        metadata: { fields: Object.keys(req.body || {}) },
      });
      return sendOk(res, plan);
    }

    if (req.method === "DELETE") {
      const plan = await planService.delete(id);
      await logActivity(req, "plan.delete", {
        resource: "plan",
        resourceId: id,
        metadata: { slug: plan?.slug },
      });
      return sendOk(res, plan);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return sendError(res, message, 400);
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return sendError(res, "Method not allowed.", 405);
}
