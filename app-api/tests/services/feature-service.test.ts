import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/user-repository", () => ({
  userRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("@/repositories/feature-repository", () => ({
  featureRepository: {
    list: vi.fn(),
  },
}));

vi.mock("@/repositories/membership-repository", () => ({
  membershipRepository: {
    findActiveByUserId: vi.fn(),
  },
}));

vi.mock("@/lib/feature-registry", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/feature-registry")>();
  return {
    ...actual,
    getAllFeatures: vi.fn(),
    isFeatureEnabled: actual.isFeatureEnabled,
  };
});

import { featureService } from "@/services/feature-service";
import { userRepository } from "@/repositories/user-repository";
import { membershipRepository } from "@/repositories/membership-repository";
import { getAllFeatures } from "@/lib/feature-registry";

const userRepo = vi.mocked(userRepository);
const memRepo = vi.mocked(membershipRepository);
const mockGetAllFeatures = vi.mocked(getAllFeatures);

const allFeatureDefs = [
  { key: "storage.5gb", description: "5 GB storage", category: "storage" },
  { key: "api.access", description: "API access", category: "features" },
  { key: "support.email", description: "Email support", category: "support" },
  {
    key: "reports.advanced",
    description: "Advanced reports",
    category: "features",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAllFeatures.mockResolvedValue(allFeatureDefs);
});

describe("featureService.checkAccess", () => {
  it("returns enabled via direct when feature is in membership", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      ancestors: [],
    } as never);
    memRepo.findActiveByUserId.mockResolvedValue([
      { featureKeys: ["api.access", "storage.5gb"] },
    ] as never);

    const result = await featureService.checkAccess("u1", "api.access");

    expect(result).toEqual({
      key: "api.access",
      description: "API access",
      category: "features",
      enabled: true,
      source: "direct",
    });
  });

  it("returns inherited when sub-user gets feature from parent", async () => {
    userRepo.findById.mockResolvedValue({
      id: "sub-1",
      parentId: "root-1",
      ancestors: ["root-1"],
    } as never);
    memRepo.findActiveByUserId
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ featureKeys: ["api.access"] }] as never);

    const result = await featureService.checkAccess("sub-1", "api.access");

    expect(result).toEqual({
      key: "api.access",
      description: "API access",
      category: "features",
      enabled: true,
      source: "inherited",
    });
  });

  it("returns direct for sub-user's own membership", async () => {
    userRepo.findById.mockResolvedValue({
      id: "sub-1",
      parentId: "root-1",
      ancestors: ["root-1"],
    } as never);
    memRepo.findActiveByUserId.mockResolvedValue([
      { featureKeys: ["reports.advanced"] },
    ] as never);

    const result = await featureService.checkAccess("sub-1", "reports.advanced");

    expect(result).toEqual({
      key: "reports.advanced",
      description: "Advanced reports",
      category: "features",
      enabled: true,
      source: "direct",
    });
  });

  it("returns disabled when feature is not found anywhere", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      ancestors: [],
    } as never);
    memRepo.findActiveByUserId.mockResolvedValue([] as never);

    const result = await featureService.checkAccess("u1", "nonexistent");

    expect(result).toEqual({
      key: "nonexistent",
      description: "",
      category: "",
      enabled: false,
      source: "direct",
    });
  });

  it("returns disabled when user has no memberships", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      ancestors: [],
    } as never);
    memRepo.findActiveByUserId.mockResolvedValue([] as never);

    const result = await featureService.checkAccess("u1", "api.access");

    expect(result.enabled).toBe(false);
  });

  it("returns disabled when user not found", async () => {
    userRepo.findById.mockResolvedValue(null as never);
    memRepo.findActiveByUserId.mockResolvedValue([] as never);

    const result = await featureService.checkAccess("unknown", "api.access");

    expect(result.enabled).toBe(false);
  });
});

describe("featureService.getEnabledFeatures", () => {
  it("returns direct features for root user", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      ancestors: [],
    } as never);
    memRepo.findActiveByUserId.mockResolvedValue([
      { featureKeys: ["storage.5gb", "api.access"] },
    ] as never);

    const result = await featureService.getEnabledFeatures("u1");

    expect(result).toEqual([
      {
        key: "storage.5gb",
        description: "5 GB storage",
        category: "storage",
        enabled: true,
        source: "direct",
      },
      {
        key: "api.access",
        description: "API access",
        category: "features",
        enabled: true,
        source: "direct",
      },
    ]);
  });

  it("returns inherited source for sub-user features", async () => {
    userRepo.findById.mockResolvedValue({
      id: "sub-1",
      parentId: "root-1",
      ancestors: ["root-1"],
    } as never);
    memRepo.findActiveByUserId.mockResolvedValue([
      { featureKeys: ["storage.5gb", "api.access"] },
    ] as never);

    const result = await featureService.getEnabledFeatures("sub-1");

    expect(result).toEqual([
      {
        key: "storage.5gb",
        description: "5 GB storage",
        category: "storage",
        enabled: true,
        source: "inherited",
      },
      {
        key: "api.access",
        description: "API access",
        category: "features",
        enabled: true,
        source: "inherited",
      },
    ]);
  });

  it("includes parent memberships as inherited for sub-users", async () => {
    userRepo.findById.mockResolvedValue({
      id: "sub-1",
      parentId: "root-1",
      ancestors: ["root-1"],
    } as never);
    memRepo.findActiveByUserId
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([{ featureKeys: ["reports.advanced"] }] as never);

    const result = await featureService.getEnabledFeatures("sub-1");

    expect(result).toContainEqual({
      key: "reports.advanced",
      description: "Advanced reports",
      category: "features",
      enabled: true,
      source: "inherited",
    });
  });

  it("returns empty array when user has no features", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      ancestors: [],
    } as never);
    memRepo.findActiveByUserId.mockResolvedValue([] as never);

    const result = await featureService.getEnabledFeatures("u1");

    expect(result).toEqual([]);
  });
});

describe("featureService.getAllDefinitions", () => {
  it("returns all feature definitions from the registry", async () => {
    const result = await featureService.getAllDefinitions();

    expect(result).toEqual(allFeatureDefs);
    expect(mockGetAllFeatures).toHaveBeenCalledOnce();
  });
});
