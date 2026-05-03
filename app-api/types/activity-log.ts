export type ActivityAction =
  | "admin.login"
  | "admin.login_failed"
  | "admin.logout"
  | "admin.create"
  | "admin.update"
  | "admin.delete"
  | "user.login"
  | "user.login_failed"
  | "user.register"
  | "user.logout"
  | "user.create"
  | "user.update"
  | "user.delete"
  | "profile.update";

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
};

export type ActivityLogFilter = {
  actor?: ActivityActor;
  actorId?: string;
  action?: ActivityAction;
  resource?: string;
  page?: number;
  limit?: number;
};
