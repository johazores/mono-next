export type ProductBreakdown = {
  productId: string;
  productName: string;
  count: number;
  revenue: number;
};

export type SubscriptionBreakdown = {
  productId: string;
  productName: string;
  count: number;
};

export type AdminReport = {
  revenue: { totalRevenue: number; totalTransactions: number };
  subscriptions: {
    activeSubscriptions: number;
    totalSubscriptions: number;
    byProduct: SubscriptionBreakdown[];
  };
  purchases: {
    totalPurchases: number;
    byStatus: Record<string, number>;
    byProduct: ProductBreakdown[];
  };
  users: {
    totalUsers: number;
    activeSubscribers: number;
    newUsersLast30Days: number;
  };
};

export type ReportPeriod = "7d" | "30d" | "90d" | "1y";
