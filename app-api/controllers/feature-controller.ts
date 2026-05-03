import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/user-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { featureService } from "@/services/feature-service";

export async function featureController(
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

  const features = await featureService.getEnabledFeatures(session.user.id);
  sendOk(res, { features });
}
