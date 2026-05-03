import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const planSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  currency: true,
  interval: true,
} as const;

export const subscriptionRepository = {
  findByUserId(userId: string) {
    return prisma.subscription.findMany({
      where: { userId },
      include: { plan: { select: planSelect } },
      orderBy: { createdAt: "desc" },
    });
  },

  findActiveByUserId(userId: string) {
    return prisma.subscription.findFirst({
      where: { userId, status: "active" },
      include: { plan: { select: planSelect } },
      orderBy: { createdAt: "desc" },
    });
  },

  create(data: Prisma.SubscriptionCreateInput) {
    return prisma.subscription.create({
      data,
      include: { plan: { select: planSelect } },
    });
  },

  update(id: string, data: Prisma.SubscriptionUpdateInput) {
    return prisma.subscription.update({
      where: { id },
      data,
      include: { plan: { select: planSelect } },
    });
  },

  cancelActiveByUserId(userId: string) {
    return prisma.subscription.updateMany({
      where: { userId, status: "active" },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
  },

  findExpired() {
    return prisma.subscription.findMany({
      where: {
        status: "active",
        endDate: { lte: new Date() },
      },
    });
  },

  expireBatch(ids: string[]) {
    return prisma.subscription.updateMany({
      where: { id: { in: ids } },
      data: { status: "expired" },
    });
  },
};
