import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/membership-repository", () => ({
  membershipRepository: {
    findActiveByUserId: vi.fn(),
    findByUserId: vi.fn(),
    create: vi.fn(),
    revokeBySourceId: vi.fn(),
    revoke: vi.fn(),
  },
}));

import { membershipService } from "@/services/membership-service";
import { membershipRepository } from "@/repositories/membership-repository";

const repo = vi.mocked(membershipRepository);

const now = new Date();

function fakeMembership(overrides = {}) {
  return {
    id: "mem-1",
    userId: "user-1",
    type: "purchase",
    sourceId: "purchase-1",
    featureKeys: ["api.access", "storage.5gb"],
    status: "active",
    expiresAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("membershipService.getActiveByUserId", () => {
  it("returns active memberships for a user", async () => {
    const memberships = [fakeMembership()];
    repo.findActiveByUserId.mockResolvedValue(memberships as never);

    const result = await membershipService.getActiveByUserId("user-1");

    expect(repo.findActiveByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toEqual(memberships);
  });

  it("returns empty array when no active memberships", async () => {
    repo.findActiveByUserId.mockResolvedValue([] as never);

    const result = await membershipService.getActiveByUserId("user-1");
    expect(result).toEqual([]);
  });
});

describe("membershipService.getAllByUserId", () => {
  it("returns all memberships including revoked", async () => {
    const memberships = [
      fakeMembership(),
      fakeMembership({ id: "mem-2", status: "revoked" }),
    ];
    repo.findByUserId.mockResolvedValue(memberships as never);

    const result = await membershipService.getAllByUserId("user-1");

    expect(repo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toHaveLength(2);
  });
});

describe("membershipService.grantFromPurchase", () => {
  it("revokes previous purchase membership then creates new one", async () => {
    const membership = fakeMembership({
      type: "purchase",
      sourceId: "purchase-1",
    });
    repo.revokeBySourceId.mockResolvedValue(undefined as never);
    repo.create.mockResolvedValue(membership as never);

    const result = await membershipService.grantFromPurchase(
      "user-1",
      "purchase-1",
      ["api.access", "storage.5gb"],
    );

    expect(repo.revokeBySourceId).toHaveBeenCalledWith("purchase-1");
    expect(repo.create).toHaveBeenCalledWith({
      userId: "user-1",
      type: "purchase",
      sourceId: "purchase-1",
      featureKeys: ["api.access", "storage.5gb"],
    });
    expect(result).toEqual(membership);
  });
});

describe("membershipService.revokeBySource", () => {
  it("revokes all memberships with the given source ID", async () => {
    repo.revokeBySourceId.mockResolvedValue(undefined as never);

    await membershipService.revokeBySource("purchase-1");

    expect(repo.revokeBySourceId).toHaveBeenCalledWith("purchase-1");
  });
});

describe("membershipService.revoke", () => {
  it("revokes a single membership by ID", async () => {
    const revoked = fakeMembership({ status: "revoked" });
    repo.revoke.mockResolvedValue(revoked as never);

    const result = await membershipService.revoke("mem-1");

    expect(repo.revoke).toHaveBeenCalledWith("mem-1");
    expect(result.status).toBe("revoked");
  });
});
