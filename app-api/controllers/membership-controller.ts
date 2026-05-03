import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/user-auth";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { membershipService } from "@/services/membership-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

/** User endpoint: list own memberships */
export async function userMembershipController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return sendError(res, "Method not allowed.", 405);
  }

  const session = await requireUser(req, res);
  if (!session) return;

  const items = await membershipService.getActiveByUserId(session.user.id);
  sendOk(res, { items });
}

/** Admin endpoint: grant or revoke memberships */
export async function adminMembershipController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res, ["admin"]);
  if (!session) return;

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    const { userId, sourceId, featureKeys } = req.body || {};
    if (!userId || !sourceId || !Array.isArray(featureKeys)) {
      return sendError(
        res,
        "userId, sourceId, and featureKeys[] are required.",
        400,
      );
    }
    try {
      const membership = await membershipService.grantFromPurchase(
        userId,
        sourceId,
        featureKeys,
      );
      await logActivity(req, "membership.grant", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "membership",
        resourceId: membership.id,
      });
      return sendOk(res, membership, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.body || {};
    if (!id) return sendError(res, "Membership id is required.", 400);
    try {
      const membership = await membershipService.revoke(id);
      await logActivity(req, "membership.revoke", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "membership",
        resourceId: id,
      });
      return sendOk(res, membership);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["POST", "DELETE"]);
  return sendError(res, "Method not allowed.", 405);
}
