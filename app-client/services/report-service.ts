import { apiGet } from "@/services/api-client";
import type { AdminReport, ReportPeriod } from "@/types";

export const reportService = {
  async get(period: ReportPeriod): Promise<AdminReport | null> {
    const result = await apiGet<AdminReport>(
      `/api/admins/reports?period=${period}`,
    );
    return result.data ?? null;
  },
};
