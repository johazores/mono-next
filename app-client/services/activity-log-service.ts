import { apiGet } from "./api-client";
import type { ActivityLogList } from "@/types";

export const activityLogService = {
  async list(params?: Record<string, string>) {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiGet<ActivityLogList>(`/api/activity-logs${query}`);
  },
};
