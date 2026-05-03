import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { requireUser } from "@/lib/user-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { reportService } from "@/services/report-service";
import type { ReportPeriod } from "@/types";

const VALID_PERIODS = ["7d", "30d", "90d", "1y"];

export async function adminReportController(
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

  const session = await requireAdmin(req, res);
  if (!session) return;

  const period = VALID_PERIODS.includes(String(req.query.period))
    ? (String(req.query.period) as ReportPeriod)
    : "30d";

  const report = await reportService.getAdminDashboard(period);
  sendOk(res, report);
}

export async function userReportController(
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

  const report = await reportService.getUserReport(session.user.id);
  sendOk(res, report);
}
