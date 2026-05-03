import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/report-repository", () => ({
  reportRepository: {
    getRevenueSummary: vi.fn(),
    getSubscriptionStats: vi.fn(),
    getPurchaseStats: vi.fn(),
    getUserStats: vi.fn(),
    getUserActivityReport: vi.fn(),
  },
}));

import { reportService } from "@/services/report-service";
import { reportRepository } from "@/repositories/report-repository";

const repo = vi.mocked(reportRepository);

const fakeRevenue = {
  totalRevenue: 500,
  totalTransactions: 10,
  byCurrency: { USD: 500 },
};
const fakeSubscriptions = {
  activeSubscriptions: 8,
  totalSubscriptions: 15,
  byProduct: [
    { productId: "p1", productName: "Pro", count: 5 },
    { productId: "p2", productName: "Starter", count: 3 },
  ],
};
const fakePurchases = {
  totalPurchases: 10,
  byStatus: { completed: 10 },
  byProduct: [
    { productId: "prod-1", productName: "API Pass", count: 5, revenue: 250 },
  ],
};
const fakeUsers = {
  totalUsers: 20,
  activeSubscribers: 8,
  newUsersLast30Days: 5,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("reportService.getAdminDashboard", () => {
  it("returns aggregated dashboard data for the given period", async () => {
    repo.getRevenueSummary.mockResolvedValue(fakeRevenue as never);
    repo.getSubscriptionStats.mockResolvedValue(fakeSubscriptions as never);
    repo.getPurchaseStats.mockResolvedValue(fakePurchases as never);
    repo.getUserStats.mockResolvedValue(fakeUsers as never);

    const result = await reportService.getAdminDashboard("30d");

    expect(result.period).toBe("30d");
    expect(result.revenue).toEqual(fakeRevenue);
    expect(result.subscriptions).toEqual(fakeSubscriptions);
    expect(result.purchases).toEqual(fakePurchases);
    expect(result.users).toEqual(fakeUsers);
  });

  it("calls all repository methods in parallel", async () => {
    repo.getRevenueSummary.mockResolvedValue(fakeRevenue as never);
    repo.getSubscriptionStats.mockResolvedValue(fakeSubscriptions as never);
    repo.getPurchaseStats.mockResolvedValue(fakePurchases as never);
    repo.getUserStats.mockResolvedValue(fakeUsers as never);

    await reportService.getAdminDashboard("7d");

    expect(repo.getRevenueSummary).toHaveBeenCalledOnce();
    expect(repo.getSubscriptionStats).toHaveBeenCalledOnce();
    expect(repo.getPurchaseStats).toHaveBeenCalledOnce();
    expect(repo.getUserStats).toHaveBeenCalledOnce();
  });

  it("passes correct date range for 7d period", async () => {
    repo.getRevenueSummary.mockResolvedValue(fakeRevenue as never);
    repo.getSubscriptionStats.mockResolvedValue(fakeSubscriptions as never);
    repo.getPurchaseStats.mockResolvedValue(fakePurchases as never);
    repo.getUserStats.mockResolvedValue(fakeUsers as never);

    await reportService.getAdminDashboard("7d");

    const [start] = repo.getRevenueSummary.mock.calls[0];
    const daysDiff = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThanOrEqual(6.9);
    expect(daysDiff).toBeLessThanOrEqual(7.1);
  });

  it("defaults to 30d period when not specified", async () => {
    repo.getRevenueSummary.mockResolvedValue(fakeRevenue as never);
    repo.getSubscriptionStats.mockResolvedValue(fakeSubscriptions as never);
    repo.getPurchaseStats.mockResolvedValue(fakePurchases as never);
    repo.getUserStats.mockResolvedValue(fakeUsers as never);

    const result = await reportService.getAdminDashboard();

    expect(result.period).toBe("30d");
    const [start] = repo.getRevenueSummary.mock.calls[0];
    const daysDiff = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThanOrEqual(29.9);
    expect(daysDiff).toBeLessThanOrEqual(30.1);
  });
});

describe("reportService.getUserReport", () => {
  it("returns the user activity report", async () => {
    const fakeReport = {
      plan: { name: "Pro" },
      purchases: [],
      memberships: [],
    };
    repo.getUserActivityReport.mockResolvedValue(fakeReport as never);

    const result = await reportService.getUserReport("user-1");

    expect(repo.getUserActivityReport).toHaveBeenCalledWith("user-1");
    expect(result).toEqual(fakeReport);
  });
});
