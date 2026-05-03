import { prisma } from "@/lib/prisma";

export const reportRepository = {
  async getRevenueSummary(startDate: Date, endDate: Date) {
    const purchases = await prisma.purchase.findMany({
      where: {
        status: "completed",
        createdAt: { gte: startDate, lte: endDate },
      },
      select: { amount: true, currency: true },
    });

    let totalRevenue = 0;
    const byCurrency: Record<string, number> = {};
    for (const p of purchases) {
      totalRevenue += p.amount;
      byCurrency[p.currency] = (byCurrency[p.currency] ?? 0) + p.amount;
    }

    return { totalRevenue, totalTransactions: purchases.length, byCurrency };
  },

  async getSubscriptionStats() {
    const [active, total] = await Promise.all([
      prisma.purchase.count({
        where: { status: "active", product: { paymentModel: "recurring" } },
      }),
      prisma.purchase.count({
        where: { product: { paymentModel: "recurring" } },
      }),
    ]);

    const subs = await prisma.purchase.findMany({
      where: { status: "active", product: { paymentModel: "recurring" } },
      include: { product: { select: { id: true, name: true, slug: true } } },
    });
    const byProduct: Record<
      string,
      { productId: string; productName: string; count: number }
    > = {};
    for (const s of subs) {
      const key = s.product.id;
      if (!byProduct[key]) {
        byProduct[key] = {
          productId: s.product.id,
          productName: s.product.name,
          count: 0,
        };
      }
      byProduct[key].count++;
    }

    return {
      activeSubscriptions: active,
      totalSubscriptions: total,
      byProduct: Object.values(byProduct),
    };
  },

  async getPurchaseStats(startDate: Date, endDate: Date) {
    const purchases = await prisma.purchase.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { product: { select: { id: true, name: true, type: true } } },
    });

    const byStatus: Record<string, number> = {};
    const byProduct: Record<
      string,
      { productId: string; productName: string; count: number; revenue: number }
    > = {};

    for (const p of purchases) {
      byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
      const key = p.productId;
      if (!byProduct[key]) {
        byProduct[key] = {
          productId: p.productId,
          productName: p.product.name,
          count: 0,
          revenue: 0,
        };
      }
      byProduct[key].count++;
      if (p.status === "completed") {
        byProduct[key].revenue += p.amount;
      }
    }

    return {
      totalPurchases: purchases.length,
      byStatus,
      byProduct: Object.values(byProduct),
    };
  },

  async getUserStats() {
    const [totalUsers, activeSubscribers] = await Promise.all([
      prisma.user.count(),
      prisma.purchase.count({
        where: { status: "active", product: { paymentModel: "recurring" } },
      }),
    ]);

    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
    });

    return {
      totalUsers,
      activeSubscribers,
      newUsersLast30Days: recentUsers,
    };
  },

  async getUserActivityReport(userId: string) {
    const [purchases, memberships, subscription] = await Promise.all([
      prisma.purchase.findMany({
        where: { userId },
        include: { product: { select: { name: true, type: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.membership.findMany({
        where: { userId, status: "active" },
      }),
      prisma.purchase.findFirst({
        where: {
          userId,
          status: "active",
          product: { paymentModel: "recurring" },
        },
        include: { product: { select: { name: true } } },
      }),
    ]);

    return {
      currentPlan: subscription?.product.name ?? null,
      totalPurchases: purchases.length,
      activeMemberships: memberships.length,
      recentPurchases: purchases.map((p) => ({
        productName: p.product.name,
        productType: p.product.type,
        amount: p.amount,
        status: p.status,
        date: p.createdAt,
      })),
      activeFeatureKeys: memberships.flatMap((m) => m.featureKeys as string[]),
    };
  },
};
