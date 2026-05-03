import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/setting-repository", () => ({
  settingRepository: {
    get: vi.fn(),
    getMany: vi.fn(),
    getAll: vi.fn(),
    set: vi.fn(),
  },
}));

import { settingService } from "@/services/setting-service";
import { settingRepository } from "@/repositories/setting-repository";

const repo = vi.mocked(settingRepository);

beforeEach(() => vi.clearAllMocks());

describe("settingService.get", () => {
  it("returns the value if the setting exists", async () => {
    repo.get.mockResolvedValue({
      id: "1",
      key: "auth.provider",
      value: "clerk",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await settingService.get("auth.provider");
    expect(result).toBe("clerk");
  });

  it("returns null if the setting does not exist", async () => {
    repo.get.mockResolvedValue(null);
    const result = await settingService.get("auth.provider");
    expect(result).toBeNull();
  });
});

describe("settingService.set", () => {
  it("rejects unknown keys", async () => {
    await expect(settingService.set("unknown.key", "val")).rejects.toThrow(
      "Unknown setting key",
    );
  });

  it("rejects invalid auth provider values", async () => {
    await expect(settingService.set("auth.provider", "google")).rejects.toThrow(
      "Invalid auth provider",
    );
  });

  it("accepts valid auth provider", async () => {
    repo.set.mockResolvedValue({} as never);
    await settingService.set("auth.provider", "clerk");
    expect(repo.set).toHaveBeenCalledWith("auth.provider", "clerk");
  });

  it("accepts valid Clerk key settings", async () => {
    repo.set.mockResolvedValue({} as never);
    await settingService.set("auth.clerkPublishableKey", "pk_test_123");
    expect(repo.set).toHaveBeenCalledWith(
      "auth.clerkPublishableKey",
      "pk_test_123",
    );
  });

  it("accepts valid Clerk secret key settings", async () => {
    repo.set.mockResolvedValue({} as never);
    await settingService.set("auth.clerkSecretKey", "sk_test_456");
    expect(repo.set).toHaveBeenCalledWith("auth.clerkSecretKey", "sk_test_456");
  });
});

describe("settingService.getAll", () => {
  it("returns all settings as key-value pairs", async () => {
    repo.getAll.mockResolvedValue([
      {
        id: "1",
        key: "auth.provider",
        value: "credentials",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        key: "auth.clerkPublishableKey",
        value: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const result = await settingService.getAll();
    expect(result).toEqual([
      { key: "auth.provider", value: "credentials" },
      { key: "auth.clerkPublishableKey", value: "" },
    ]);
  });

  it("returns empty array when no settings exist", async () => {
    repo.getAll.mockResolvedValue([]);
    const result = await settingService.getAll();
    expect(result).toEqual([]);
  });
});

describe("settingService.getAuthConfig", () => {
  it("returns defaults when no settings exist", async () => {
    repo.getMany.mockResolvedValue([]);
    const config = await settingService.getAuthConfig();
    expect(config).toEqual({
      provider: "credentials",
      clerkPublishableKey: "",
      clerkSecretKey: "",
    });
  });

  it("returns stored values", async () => {
    repo.getMany.mockResolvedValue([
      {
        id: "1",
        key: "auth.provider",
        value: "clerk",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        key: "auth.clerkPublishableKey",
        value: "pk_test_abc",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        key: "auth.clerkSecretKey",
        value: "sk_test_xyz",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const config = await settingService.getAuthConfig();
    expect(config).toEqual({
      provider: "clerk",
      clerkPublishableKey: "pk_test_abc",
      clerkSecretKey: "sk_test_xyz",
    });
  });
});

describe("settingService.getPublicAuthConfig", () => {
  it("excludes the secret key", async () => {
    repo.getMany.mockResolvedValue([
      {
        id: "1",
        key: "auth.provider",
        value: "clerk",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        key: "auth.clerkPublishableKey",
        value: "pk_test_abc",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        key: "auth.clerkSecretKey",
        value: "sk_test_xyz",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const config = await settingService.getPublicAuthConfig();
    expect(config).toEqual({
      provider: "clerk",
      clerkPublishableKey: "pk_test_abc",
    });
    expect(config).not.toHaveProperty("clerkSecretKey");
  });
});
