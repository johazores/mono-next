import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/feature-repository", () => ({
  featureRepository: {
    list: vi.fn(),
    listAll: vi.fn(),
    findById: vi.fn(),
    findByKey: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import {
  getAllFeatures,
  invalidateFeatureCache,
  getFeatureDefinition,
  isFeatureEnabled,
  getEnabledFeatures,
} from "@/lib/feature-registry";
import { featureRepository } from "@/repositories/feature-repository";

const repo = vi.mocked(featureRepository);

const fakeRows = [
  { key: "storage.5gb", description: "5 GB storage", category: "storage" },
  { key: "api.access", description: "API access", category: "features" },
  { key: "support.email", description: "Email support", category: "support" },
];

beforeEach(() => {
  vi.clearAllMocks();
  invalidateFeatureCache();
});

describe("getAllFeatures", () => {
  it("fetches from repository on first call", async () => {
    repo.list.mockResolvedValue(fakeRows as never);

    const result = await getAllFeatures();

    expect(repo.list).toHaveBeenCalledOnce();
    expect(result).toEqual([
      { key: "storage.5gb", description: "5 GB storage", category: "storage" },
      { key: "api.access", description: "API access", category: "features" },
      {
        key: "support.email",
        description: "Email support",
        category: "support",
      },
    ]);
  });

  it("returns cached data on subsequent calls within TTL", async () => {
    repo.list.mockResolvedValue(fakeRows as never);

    await getAllFeatures();
    await getAllFeatures();
    await getAllFeatures();

    expect(repo.list).toHaveBeenCalledOnce();
  });

  it("refetches after cache is invalidated", async () => {
    repo.list.mockResolvedValue(fakeRows as never);

    await getAllFeatures();
    invalidateFeatureCache();
    await getAllFeatures();

    expect(repo.list).toHaveBeenCalledTimes(2);
  });

  it("returns empty array when repository returns empty", async () => {
    repo.list.mockResolvedValue([] as never);

    const result = await getAllFeatures();
    expect(result).toEqual([]);
  });
});

describe("getFeatureDefinition", () => {
  it("returns the matching feature definition", async () => {
    repo.list.mockResolvedValue(fakeRows as never);

    const def = await getFeatureDefinition("api.access");
    expect(def).toEqual({
      key: "api.access",
      description: "API access",
      category: "features",
    });
  });

  it("returns undefined for unknown key", async () => {
    repo.list.mockResolvedValue(fakeRows as never);

    const def = await getFeatureDefinition("nonexistent.feature");
    expect(def).toBeUndefined();
  });
});

describe("isFeatureEnabled", () => {
  it("returns true when key is in plan features", () => {
    expect(isFeatureEnabled(["api.access", "storage.5gb"], "api.access")).toBe(
      true,
    );
  });

  it("returns false when key is not in plan features", () => {
    expect(isFeatureEnabled(["storage.5gb"], "api.access")).toBe(false);
  });

  it("returns false for empty plan features", () => {
    expect(isFeatureEnabled([], "api.access")).toBe(false);
  });
});

describe("getEnabledFeatures", () => {
  it("returns only features whose keys are in the plan", async () => {
    repo.list.mockResolvedValue(fakeRows as never);

    const result = await getEnabledFeatures(["api.access", "support.email"]);
    expect(result).toEqual([
      { key: "api.access", description: "API access", category: "features" },
      {
        key: "support.email",
        description: "Email support",
        category: "support",
      },
    ]);
  });

  it("returns empty array when no plan features match", async () => {
    repo.list.mockResolvedValue(fakeRows as never);

    const result = await getEnabledFeatures(["nonexistent"]);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty plan features", async () => {
    repo.list.mockResolvedValue(fakeRows as never);

    const result = await getEnabledFeatures([]);
    expect(result).toEqual([]);
  });
});
