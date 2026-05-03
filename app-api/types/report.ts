export type ReportPeriod = "7d" | "30d" | "90d" | "1y";

export type RevenueSummary = {
  totalRevenue: number;
  totalTransactions: number;
  byCurrency: Record<string, number>;
};

export type SubscriptionStats = {
  activeSubscriptions: number;
  totalSubscriptions: number;
  byProduct: { productId: string; productName: string; count: number }[];
};

export type PurchaseStats = {
  totalPurchases: number;
  byStatus: Record<string, number>;
  byProduct: {
    productId: string;
    productName: string;
    count: number;
    revenue: number;
  }[];
};

export type UserStats = {
  totalUsers: number;
  activeSubscribers: number;
  newUsersLast30Days: number;
};

export type UserActivityReport = {
  currentPlan: string | null;
  totalPurchases: number;
  activeMemberships: number;
  recentPurchases: {
    productName: string;
    productType: string;
    amount: number;
    status: string;
    date: Date;
  }[];
  activeFeatureKeys: string[];
};
