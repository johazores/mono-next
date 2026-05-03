import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/activity-log-repository", () => ({
  activityLogRepository: {
    create: vi.fn(),
    list: vi.fn(),
    count: vi.fn(),
  },
}));

import { activityLogService } from "@/services/activity-log-service";
import { activityLogRepository } from "@/repositories/activity-log-repository";

const repo = vi.mocked(activityLogRepository);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("activityLogService.log", () => {
  it("calls repository.create with the input", async () => {
    repo.create.mockResolvedValue(undefined as never);

    const input = {
      actor: "admin" as const,
      action: "admin.login" as const,
      actorId: "admin-1",
      actorEmail: "admin@test.com",
    };

    await activityLogService.log(input);
    expect(repo.create).toHaveBeenCalledWith(input);
  });

  it("swallows errors without throwing", async () => {
    repo.create.mockRejectedValue(new Error("DB connection failed"));

    await expect(
      activityLogService.log({
        actor: "system",
        action: "admin.login_failed",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("activityLogService.list", () => {
  it("returns items and total from repository", async () => {
    const fakeItems = [
      {
        id: "log-1",
        actor: "admin",
        actorId: null,
        actorEmail: null,
        action: "admin.login",
        resource: null,
        resourceId: null,
        metadata: null,
        ip: null,
        createdAt: new Date(),
      },
    ];
    repo.list.mockResolvedValue(fakeItems as never);
    repo.count.mockResolvedValue(1 as never);

    const result = await activityLogService.list({ page: 1, limit: 10 });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(repo.list).toHaveBeenCalledWith({ page: 1, limit: 10 });
    expect(repo.count).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it("runs list and count in parallel", async () => {
    const order: string[] = [];
    repo.list.mockImplementation((() => {
      order.push("list");
      return Promise.resolve([]);
    }) as never);
    repo.count.mockImplementation((() => {
      order.push("count");
      return Promise.resolve(0);
    }) as never);

    await activityLogService.list({});
    expect(order).toContain("list");
    expect(order).toContain("count");
  });
});
