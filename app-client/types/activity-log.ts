export type ActivityLogEntry = {
  id: string;
  actor: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  resource: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
};

export type ActivityLogList = {
  items: ActivityLogEntry[];
  total: number;
};
