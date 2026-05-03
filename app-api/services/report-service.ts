import { reportRepository } from "@/repositories/report-repository";
import type { ReportPeriod } from "@/types";

function resolveDates(period: ReportPeriod): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  switch (period) {
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "90d":
      start.setDate(start.getDate() - 90);
      break;
    case "1y":
      start.setFullYear(start.getFullYear() - 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }
  return { start, end };
}

export const reportService = {
  async getAdminDashboard(period: ReportPeriod = "30d") {
    const { start, end } = resolveDates(period);

    const [revenue, subscriptions, purchases, users] = await Promise.all([
      reportRepository.getRevenueSummary(start, end),
      reportRepository.getSubscriptionStats(),
      reportRepository.getPurchaseStats(start, end),
      reportRepository.getUserStats(),
    ]);

    return { period, revenue, subscriptions, purchases, users };
  },

  async getUserReport(userId: string) {
    return reportRepository.getUserActivityReport(userId);
  },
};
