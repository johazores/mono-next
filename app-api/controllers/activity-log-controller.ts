import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendOk, sendError } from "@/lib/api-response";
import { activityLogService } from "@/services/activity-log-service";
import type { ActivityLogFilter, ActivityActor, ActivityAction } from "@/types";

export async function activityLogCollectionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res, ["admin"]);
  if (!session) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    sendError(res, "Method not allowed.", 405);
    return;
  }

  const filter: ActivityLogFilter = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 50,
  };

  if (req.query.actor) filter.actor = req.query.actor as ActivityActor;
  if (req.query.actorId) filter.actorId = String(req.query.actorId);
  if (req.query.action) filter.action = req.query.action as ActivityAction;
  if (req.query.resource) filter.resource = String(req.query.resource);
  if (req.query.from) filter.from = String(req.query.from);
  if (req.query.to) filter.to = String(req.query.to);

  const result = await activityLogService.list(filter);
  sendOk(res, result);
}
