import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { requireUser } from "@/lib/user-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { subscriptionService } from "@/services/subscription-service";
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
      const history = await subscriptionService.getHistory(userId);
      return sendOk(res, { items: history });
    }

    if (!verifyCsrf(req, res)) return;

    if (req.method === "POST") {
      const { planId, externalId, endDate } = req.body ?? {};
      if (!planId) return sendError(res, "Plan ID is required.", 400);

      const sub = await subscriptionService.assign(userId, planId, {
        externalId,
        endDate,
      });
      await logActivity(req, "subscription.assign", {
        resource: "subscription",
        resourceId: sub.id,
        metadata: { userId, planId },
      });
      return sendOk(res, sub, 201);
    }

    if (req.method === "DELETE") {
      await subscriptionService.cancel(userId);
      await logActivity(req, "subscription.cancel", {
        resource: "subscription",
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

  const active = await subscriptionService.getActiveSubscription(
    session.user.id,
  );
  const history = await subscriptionService.getHistory(session.user.id);
  sendOk(res, { active, history });
}
