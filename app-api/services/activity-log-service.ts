import { activityLogRepository } from "@/repositories/activity-log-repository";
import type {
  CreateActivityLogInput,
  ActivityLogFilter,
  ActivityLogRecord,
} from "@/types";

export const activityLogService = {
  async log(input: CreateActivityLogInput): Promise<void> {
    try {
      await activityLogRepository.create(input);
    } catch {
      // Activity logging should never break the main request flow.
      // In production, pipe to an external error tracker.
      console.error("[activity-log] Failed to write log entry");
    }
  },

  async list(
    filter: ActivityLogFilter,
  ): Promise<{ items: ActivityLogRecord[]; total: number }> {
    const [items, total] = await Promise.all([
      activityLogRepository.list(filter),
      activityLogRepository.count(filter),
    ]);

    return {
      items: items as unknown as ActivityLogRecord[],
      total,
    };
  },
};
