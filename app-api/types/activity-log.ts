export type ActivityAction =
  | "admin.login"
  | "admin.login_failed"
  | "admin.logout"
  | "admin.locked"
  | "admin.create"
  | "admin.update"
  | "admin.delete"
  | "user.login"
  | "user.login_failed"
  | "user.register"
  | "user.logout"
  | "user.locked"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "profile.update"
  | "plan.create"
  | "plan.update"
  | "plan.delete"
  | "subscription.assign"
  | "subscription.cancel";

export type ActivityActor = "admin" | "user" | "system";

export type ActivityLogRecord = {
  id: string;
  actor: ActivityActor;
  actorId: string | null;
  actorEmail: string | null;
  action: ActivityAction;
  resource: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  method: string | null;
  path: string | null;
  createdAt: Date;
};

export type CreateActivityLogInput = {
  actor: ActivityActor;
  actorId?: string;
  actorEmail?: string;
  action: ActivityAction;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  method?: string;
  path?: string;
};

export type ActivityLogFilter = {
  actor?: ActivityActor;
  actorId?: string;
  action?: ActivityAction;
  resource?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};
