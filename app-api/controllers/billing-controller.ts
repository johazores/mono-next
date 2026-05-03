import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/user-auth";
import { sendOk, sendError } from "@/lib/api-response";
import { billingService } from "@/services/billing-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function billingController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireUser(req, res);
  if (!session) return;

  // GET — fetch billing status (subscriptions from Stripe)
  if (req.method === "GET") {
    try {
      const status = await billingService.getStatus(session.user.id);
      return sendOk(res, status);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch billing status.";
      return sendError(res, message, 400);
    }
  }

  // POST — create a billing portal session
  if (req.method === "POST") {
    if (!verifyCsrf(req, res)) return;

    const { returnUrl } = req.body ?? {};
    if (!returnUrl || typeof returnUrl !== "string") {
      return sendError(res, "returnUrl is required.", 400);
    }

    try {
      const result = await billingService.createPortalSession(
        session.user.id,
        returnUrl,
      );

      await logActivity(req, "billing.portal", {
        actor: "user",
        actorId: session.user.id,
        actorEmail: session.user.email,
        resource: "billing",
      });

      return sendOk(res, result);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create billing session.";
      return sendError(res, message, 400);
    }
  }

  // PUT — sync Stripe invoices/subscriptions to local Purchase records
  if (req.method === "PUT") {
    if (!verifyCsrf(req, res)) return;

    try {
      const result = await billingService.forceSyncPurchases(session.user.id);

      await logActivity(req, "billing.sync", {
        actor: "user",
        actorId: session.user.id,
        actorEmail: session.user.email,
        resource: "billing",
        metadata: { synced: result.synced },
      });

      return sendOk(res, result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to sync billing data.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return sendError(res, "Method not allowed.", 405);
}
