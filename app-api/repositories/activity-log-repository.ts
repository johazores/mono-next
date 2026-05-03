import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CreateActivityLogInput, ActivityLogFilter } from "@/types";

export const activityLogRepository = {
  create(data: CreateActivityLogInput) {
    return prisma.activityLog.create({
      data: {
        ...data,
        metadata: data.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  },

  list(filter: ActivityLogFilter = {}) {
    const page = Math.max(1, filter.page ?? 1);
    const limit = Math.min(100, Math.max(1, filter.limit ?? 50));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filter.actor) where.actor = filter.actor;
    if (filter.actorId) where.actorId = filter.actorId;
    if (filter.action) where.action = filter.action;
    if (filter.resource) where.resource = filter.resource;

    return prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
  },

  count(filter: ActivityLogFilter = {}) {
    const where: Record<string, unknown> = {};
    if (filter.actor) where.actor = filter.actor;
    if (filter.actorId) where.actorId = filter.actorId;
    if (filter.action) where.action = filter.action;
    if (filter.resource) where.resource = filter.resource;

    return prisma.activityLog.count({ where });
  },
};
