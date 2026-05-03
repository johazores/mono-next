import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  type: true,
  price: true,
  fileUrl: true,
  accessKeys: true,
  interval: true,
  maxSubUsers: true,
} as const;

export const purchaseRepository = {
  findByUserId(userId: string) {
    return prisma.purchase.findMany({
      where: { userId },
      include: { product: { select: productSelect } },
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id: string) {
    return prisma.purchase.findUnique({
      where: { id },
      include: { product: { select: productSelect } },
    });
  },

  checkOwnership(userId: string, productId: string) {
    return prisma.purchase.findFirst({
      where: { userId, productId, status: { in: ["completed", "active"] } },
    });
  },

  /** Find the user's active subscription (recurring purchase with status=active). */
  findActiveSubscription(userId: string) {
    return prisma.purchase.findFirst({
      where: {
        userId,
        status: "active",
        product: { paymentModel: "recurring" },
      },
      include: { product: { select: productSelect } },
      orderBy: { createdAt: "desc" },
    });
  },

  /** Cancel all active recurring purchases for a user. */
  cancelActiveSubscriptions(userId: string) {
    return prisma.purchase.updateMany({
      where: {
        userId,
        status: "active",
        product: { paymentModel: "recurring" },
      },
      data: { status: "cancelled", cancelledAt: new Date() },
    });
  },

  /** Find expired active subscriptions. */
  findExpiredSubscriptions() {
    return prisma.purchase.findMany({
      where: {
        status: "active",
        endDate: { lte: new Date() },
        product: { paymentModel: "recurring" },
      },
    });
  },

  expireBatch(ids: string[]) {
    return prisma.purchase.updateMany({
      where: { id: { in: ids } },
      data: { status: "expired" },
    });
  },

  create(data: Prisma.PurchaseCreateInput) {
    return prisma.purchase.create({
      data,
      include: { product: { select: productSelect } },
    });
  },

  update(id: string, data: Prisma.PurchaseUpdateInput) {
    return prisma.purchase.update({
      where: { id },
      data,
      include: { product: { select: productSelect } },
    });
  },

  listAll() {
    return prisma.purchase.findMany({
      include: { product: { select: productSelect } },
      orderBy: { createdAt: "desc" },
    });
  },
};
