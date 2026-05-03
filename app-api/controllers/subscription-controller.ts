import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { requireUser } from "@/lib/user-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { purchaseService } from "@/services/purchase-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function userSubscriptionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // Admin endpoint: manage a user's subscriptions
  const session = await requireAdmin(req, res, ["admin"]);
  if (!session) return;

  const userId = String(req.query.id || "");

  try {
    if (req.method === "GET") {
      const history = await purchaseService.getHistory(userId);
      return sendOk(res, { items: history });
    }

    if (!verifyCsrf(req, res)) return;

    if (req.method === "POST") {
      const { productId, externalId, endDate } = req.body ?? {};
      if (!productId) return sendError(res, "Product ID is required.", 400);

      const purchase = await purchaseService.subscribe(userId, productId, {
        externalId,
        endDate,
      });
      await logActivity(req, "purchase.create", {
        resource: "purchase",
        resourceId: purchase.id,
        metadata: { userId, productId },
      });
      return sendOk(res, purchase, 201);
    }

    if (req.method === "DELETE") {
      await purchaseService.cancelSubscription(userId);
      await logActivity(req, "subscription.cancel", {
        resource: "purchase",
        metadata: { userId },
      });
      return sendOk(res, null);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return sendError(res, message, 400);
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return sendError(res, "Method not allowed.", 405);
}

export async function ownSubscriptionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireUser(req, res);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return sendError(res, "Method not allowed.", 405);
  }

  const active = await purchaseService.getActiveSubscription(session.user.id);
  const history = await purchaseService.getHistory(session.user.id);
  sendOk(res, { active, history });
}
