import type { NextApiRequest } from "next";
import { getAuthSession } from "@/lib/admin-auth";
import { getUserSession } from "@/lib/user-auth";
import { activityLogService } from "@/services/activity-log-service";
import type { ActivityAction, ActivityActor } from "@/types";

function getClientIp(req: NextApiRequest): string | undefined {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? undefined;
}

export async function logActivity(
  req: NextApiRequest,
  action: ActivityAction,
  details?: {
    actor?: ActivityActor;
    actorId?: string;
    actorEmail?: string;
    resource?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  let actor: ActivityActor = details?.actor ?? "system";
  let actorId = details?.actorId;
  let actorEmail = details?.actorEmail;

  // Auto-detect actor from session if not explicitly provided
  if (!actorId) {
    const adminSession = await getAuthSession(req);
    if (adminSession) {
      actor = "admin";
      actorId = adminSession.admin.id;
      actorEmail = adminSession.admin.email;
    } else {
      const userSession = await getUserSession(req);
      if (userSession) {
        actor = "user";
        actorId = userSession.user.id;
        actorEmail = userSession.user.email;
      }
    }
  }

  await activityLogService.log({
    actor,
    actorId,
    actorEmail,
    action,
    resource: details?.resource,
    resourceId: details?.resourceId,
    metadata: details?.metadata,
    ip: getClientIp(req),
  });
}
