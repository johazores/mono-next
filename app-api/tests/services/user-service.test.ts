import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword } from "@/lib/password";

vi.mock("@/repositories/user-repository", () => ({
  userRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    findByIdWithPassword: vi.fn(),
    findByParentId: vi.fn(),
    countChildren: vi.fn(),
    findDescendants: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    touchLastLogin: vi.fn(),
  },
}));

vi.mock("@/repositories/purchase-repository", () => ({
  purchaseRepository: {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    findActiveSubscription: vi.fn(),
    cancelActiveSubscriptions: vi.fn(),
    checkOwnership: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listAll: vi.fn(),
  },
}));

vi.mock("@/repositories/product-repository", () => ({
  productRepository: {
    list: vi.fn(),
    listAll: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    countActivePurchases: vi.fn(),
  },
}));

vi.mock("@/services/membership-service", () => ({
  membershipService: {
    grantFromPurchase: vi.fn().mockResolvedValue(undefined),
  },
}));

import { userService } from "@/services/user-service";
import { userRepository } from "@/repositories/user-repository";
import { purchaseRepository } from "@/repositories/purchase-repository";
import { productRepository } from "@/repositories/product-repository";

const repo = vi.mocked(userRepository);
const purchaseRepo = vi.mocked(purchaseRepository);
const productRepo = vi.mocked(productRepository);

const now = new Date();

function fakeUser(overrides = {}) {
  return {
    id: "user-1",
    name: "Test User",
    email: "user@test.com",
    passwordHash: hashPassword("CorrectPass1!"),
    status: "active",
    parentId: null,
    ancestors: [],
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no active subscription
  purchaseRepo.findActiveSubscription.mockResolvedValue(null as never);
});

describe("userService.authenticate", () => {
  it("returns user without passwordHash on success", async () => {
    repo.findByEmailWithPassword.mockResolvedValue(fakeUser() as never);
    repo.touchLastLogin.mockResolvedValue(undefined as never);

    const result = await userService.authenticate(
      "user@test.com",
      "CorrectPass1!",
    );
    expect(result).not.toHaveProperty("passwordHash");
    expect(result.id).toBe("user-1");
    expect(repo.touchLastLogin).toHaveBeenCalledWith("user-1");
  });

  it("throws on empty credentials", async () => {
    await expect(userService.authenticate("", "pass")).rejects.toThrow(
      "Email and password are required.",
    );
  });

  it("throws on wrong password", async () => {
    repo.findByEmailWithPassword.mockResolvedValue(fakeUser() as never);
    await expect(
      userService.authenticate("user@test.com", "WrongPassword1!"),
    ).rejects.toThrow("Invalid email or password.");
  });

  it("throws on non-existent email (timing-safe)", async () => {
    repo.findByEmailWithPassword.mockResolvedValue(null as never);
    await expect(
      userService.authenticate("nobody@test.com", "Whatever1!"),
    ).rejects.toThrow("Invalid email or password.");
  });

  it("throws on disabled account", async () => {
    repo.findByEmailWithPassword.mockResolvedValue(
      fakeUser({ status: "disabled" }) as never,
    );
    await expect(
      userService.authenticate("user@test.com", "CorrectPass1!"),
    ).rejects.toThrow("This account is disabled.");
  });
});

describe("userService.register", () => {
  it("validates required fields", async () => {
    await expect(
      userService.register({
        name: "",
        email: "a@b.com",
        password: "ValidPass1!",
      }),
    ).rejects.toThrow("Name, email, and password are required.");
  });

  it("creates user and assigns free product", async () => {
    repo.create.mockResolvedValue(fakeUser() as never);
    productRepo.findBySlug.mockResolvedValue({
      id: "product-free",
      slug: "free",
      accessKeys: ["storage.1gb", "support.community"],
    } as never);
    purchaseRepo.create.mockResolvedValue({} as never);

    const result = await userService.register({
      name: "Test User",
      email: "USER@TEST.COM",
      password: "ValidPass1!",
    });

    expect(result).not.toHaveProperty("passwordHash");
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        email: "user@test.com",
      }),
    );
    expect(productRepo.findBySlug).toHaveBeenCalledWith("free");
    expect(purchaseRepo.create).toHaveBeenCalled();
  });
});

describe("userService.update", () => {
  it("rejects invalid status", async () => {
    repo.findById.mockResolvedValue(fakeUser() as never);
    await expect(
      userService.update("user-1", { status: "banned" as never }),
    ).rejects.toThrow("Invalid status.");
  });

  it("updates user with valid input", async () => {
    repo.findById.mockResolvedValue(fakeUser() as never);
    repo.update.mockResolvedValue(fakeUser({ status: "disabled" }) as never);

    const result = await userService.update("user-1", { status: "disabled" });
    expect(result?.status).toBe("disabled");
  });

  it("throws on non-existent user", async () => {
    repo.findById.mockResolvedValue(null as never);
    await expect(userService.update("missing", {})).rejects.toThrow(
      "User not found.",
    );
  });
});

describe("userService.delete", () => {
  it("throws on non-existent user", async () => {
    repo.findById.mockResolvedValue(null as never);
    await expect(userService.delete("missing")).rejects.toThrow(
      "User not found.",
    );
  });

  it("deletes and returns user without passwordHash", async () => {
    repo.findById.mockResolvedValue(fakeUser() as never);
    repo.delete.mockResolvedValue(fakeUser() as never);

    const result = await userService.delete("user-1");
    expect(result).not.toHaveProperty("passwordHash");
    expect(repo.delete).toHaveBeenCalledWith("user-1");
  });
});

describe("userService.updateProfile", () => {
  it("updates name", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeUser() as never);
    repo.update.mockResolvedValue(fakeUser({ name: "New Name" }) as never);

    const result = await userService.updateProfile("user-1", {
      name: "New Name",
    });
    expect(result?.name).toBe("New Name");
  });

  it("checks email uniqueness on email change", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeUser() as never);
    repo.findByEmailWithPassword.mockResolvedValue(
      fakeUser({ id: "other-user" }) as never,
    );

    await expect(
      userService.updateProfile("user-1", { email: "taken@test.com" }),
    ).rejects.toThrow("Email is already in use.");
  });

  it("allows setting same email (no-op)", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeUser() as never);

    await expect(
      userService.updateProfile("user-1", { email: "user@test.com" }),
    ).rejects.toThrow("No fields to update.");
  });

  it("requires currentPassword to change password", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeUser() as never);
    await expect(
      userService.updateProfile("user-1", { newPassword: "NewPass123!" }),
    ).rejects.toThrow("Current password is required to set a new password.");
  });

  it("rejects incorrect currentPassword", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeUser() as never);
    await expect(
      userService.updateProfile("user-1", {
        currentPassword: "WrongOldPass!",
        newPassword: "NewPass123!",
      }),
    ).rejects.toThrow("Current password is incorrect.");
  });

  it("throws when no fields to update", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeUser() as never);
    await expect(userService.updateProfile("user-1", {})).rejects.toThrow(
      "No fields to update.",
    );
  });

  it("rejects name shorter than 2 characters", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeUser() as never);
    await expect(
      userService.updateProfile("user-1", { name: "X" }),
    ).rejects.toThrow("Name must be between 2 and 100 characters.");
  });
});

// --- Sub-user tests ---

const fakePurchase = {
  id: "purchase-1",
  userId: "user-1",
  productId: "product-1",
  product: {
    id: "product-1",
    name: "Starter",
    slug: "starter",
    accessKeys: ["storage.5gb", "sub-users.create"],
    maxSubUsers: 3,
    interval: "month",
  },
  amount: 9.99,
  currency: "USD",
  status: "active",
  startDate: now,
  endDate: null,
  cancelledAt: null,
  createdAt: now,
  updatedAt: now,
};

describe("userService.createSubUser", () => {
  it("creates a sub-user when plan allows it", async () => {
    const parent = fakeUser();
    const child = fakeUser({
      id: "child-1",
      name: "Child",
      email: "child@test.com",
      parentId: "user-1",
      ancestors: ["user-1"],
    });

    repo.findById.mockResolvedValue(parent as never);
    purchaseRepo.findActiveSubscription.mockResolvedValue(
      fakePurchase as never,
    );
    repo.findDescendants.mockResolvedValue([] as never);
    repo.create.mockResolvedValue(child as never);
    purchaseRepo.create.mockResolvedValue({ id: "new-purchase" } as never);

    const result = await userService.createSubUser("user-1", {
      name: "Child",
      email: "child@test.com",
      password: "ChildPass1!",
    });

    expect(result).not.toBeNull();
    expect(result!.name).toBe("Child");
    expect(result!.parentId).toBe("user-1");
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Child",
        email: "child@test.com",
        ancestors: ["user-1"],
      }),
    );
  });

  it("throws when parent not found", async () => {
    repo.findById.mockResolvedValue(null as never);

    await expect(
      userService.createSubUser("nonexistent", {
        name: "Child",
        email: "child@test.com",
        password: "ChildPass1!",
      }),
    ).rejects.toThrow("Parent user not found.");
  });

  it("throws when parent has no active subscription", async () => {
    repo.findById.mockResolvedValue(fakeUser() as never);
    purchaseRepo.findActiveSubscription.mockResolvedValue(null as never);

    await expect(
      userService.createSubUser("user-1", {
        name: "Child",
        email: "child@test.com",
        password: "ChildPass1!",
      }),
    ).rejects.toThrow("No active subscription. Cannot create sub-users.");
  });

  it("throws when plan does not allow sub-users (maxSubUsers=0)", async () => {
    repo.findById.mockResolvedValue(fakeUser() as never);
    purchaseRepo.findActiveSubscription.mockResolvedValue({
      ...fakePurchase,
      product: { ...fakePurchase.product, maxSubUsers: 0 },
    } as never);

    await expect(
      userService.createSubUser("user-1", {
        name: "Child",
        email: "child@test.com",
        password: "ChildPass1!",
      }),
    ).rejects.toThrow("Your plan does not allow sub-users.");
  });

  it("throws when sub-user limit is reached", async () => {
    repo.findById.mockResolvedValue(fakeUser() as never);
    purchaseRepo.findActiveSubscription.mockResolvedValue(
      fakePurchase as never,
    );
    // 3 existing descendants = limit reached (maxSubUsers=3)
    repo.findDescendants.mockResolvedValue([
      { id: "c1" },
      { id: "c2" },
      { id: "c3" },
    ] as never);

    await expect(
      userService.createSubUser("user-1", {
        name: "Child",
        email: "child@test.com",
        password: "ChildPass1!",
      }),
    ).rejects.toThrow("Sub-user limit reached (3)");
  });

  it("allows unlimited sub-users when maxSubUsers is -1", async () => {
    const parent = fakeUser();
    const child = fakeUser({
      id: "child-1",
      name: "Child",
      email: "child@test.com",
      parentId: "user-1",
      ancestors: ["user-1"],
    });

    repo.findById.mockResolvedValue(parent as never);
    purchaseRepo.findActiveSubscription.mockResolvedValue({
      ...fakePurchase,
      product: { ...fakePurchase.product, maxSubUsers: -1 },
    } as never);
    repo.create.mockResolvedValue(child as never);
    purchaseRepo.create.mockResolvedValue({ id: "new-purchase" } as never);

    const result = await userService.createSubUser("user-1", {
      name: "Child",
      email: "child@test.com",
      password: "ChildPass1!",
    });

    expect(result).not.toBeNull();
    // findDescendants should NOT have been called for unlimited
    expect(repo.findDescendants).not.toHaveBeenCalled();
  });

  it("validates required fields", async () => {
    repo.findById.mockResolvedValue(fakeUser() as never);
    purchaseRepo.findActiveSubscription.mockResolvedValue(
      fakePurchase as never,
    );
    repo.findDescendants.mockResolvedValue([] as never);

    await expect(
      userService.createSubUser("user-1", {
        name: "",
        email: "child@test.com",
        password: "ChildPass1!",
      }),
    ).rejects.toThrow("Name, email, and password are required.");
  });

  it("throws when parent is a sub-user", async () => {
    const subUser = fakeUser({
      id: "sub-1",
      parentId: "user-1",
      ancestors: ["root-1", "user-1"],
    });

    repo.findById.mockResolvedValue(subUser as never);

    await expect(
      userService.createSubUser("sub-1", {
        name: "GC",
        email: "gc@test.com",
        password: "GcPass123!",
      }),
    ).rejects.toThrow("Sub-users cannot create their own sub-users.");
  });
});

describe("userService.listSubUsers", () => {
  it("returns enriched sub-users with purchase counts", async () => {
    const children = [
      fakeUser({ id: "c1", name: "Child 1", parentId: "user-1" }),
      fakeUser({ id: "c2", name: "Child 2", parentId: "user-1" }),
    ];
    repo.findByParentId.mockResolvedValue(children as never);
    purchaseRepo.findActiveSubscription.mockResolvedValue(null as never);
    purchaseRepo.findByUserId
      .mockResolvedValueOnce([{ id: "p1" }] as never)
      .mockResolvedValueOnce([] as never);

    const result = await userService.listSubUsers("user-1");

    expect(repo.findByParentId).toHaveBeenCalledWith("user-1");
    expect(result).toHaveLength(2);
    expect((result[0] as Record<string, unknown>).purchaseCount).toBe(1);
    expect((result[1] as Record<string, unknown>).purchaseCount).toBe(0);
  });

  it("returns empty array when no sub-users", async () => {
    repo.findByParentId.mockResolvedValue([] as never);

    const result = await userService.listSubUsers("user-1");
    expect(result).toEqual([]);
  });
});

describe("userService.deleteSubUser", () => {
  it("deletes a sub-user owned by the parent when no purchases", async () => {
    const child = fakeUser({
      id: "child-1",
      parentId: "user-1",
      ancestors: ["user-1"],
    });
    repo.findById.mockResolvedValue(child as never);
    repo.countChildren.mockResolvedValue(0 as never);
    purchaseRepo.findByUserId.mockResolvedValue([] as never);
    repo.delete.mockResolvedValue(child as never);

    const result = await userService.deleteSubUser("user-1", "child-1");

    expect(repo.delete).toHaveBeenCalledWith("child-1");
    expect(result).not.toBeNull();
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("blocks instead of deleting when sub-user has purchases", async () => {
    const child = fakeUser({
      id: "child-1",
      parentId: "user-1",
      ancestors: ["user-1"],
    });
    const updatedChild = { ...child, status: "disabled" };
    repo.findById.mockResolvedValue(child as never);
    repo.countChildren.mockResolvedValue(0 as never);
    purchaseRepo.findByUserId.mockResolvedValue([
      { id: "p1", status: "completed" },
    ] as never);
    repo.update.mockResolvedValue(updatedChild as never);

    const result = await userService.deleteSubUser("user-1", "child-1");

    expect(repo.delete).not.toHaveBeenCalled();
    expect(repo.update).toHaveBeenCalledWith("child-1", { status: "disabled" });
    expect(result).not.toBeNull();
    expect(result!.status).toBe("disabled");
  });

  it("throws when sub-user not found", async () => {
    repo.findById.mockResolvedValue(null as never);

    await expect(
      userService.deleteSubUser("user-1", "nonexistent"),
    ).rejects.toThrow("Sub-user not found.");
  });

  it("throws when sub-user does not belong to parent", async () => {
    const child = fakeUser({
      id: "child-1",
      parentId: "other-user",
      ancestors: ["other-user"],
    });
    repo.findById.mockResolvedValue(child as never);

    await expect(
      userService.deleteSubUser("user-1", "child-1"),
    ).rejects.toThrow("This user is not your sub-user.");
  });

  it("prevents deleting a sub-user that has children", async () => {
    const child = fakeUser({
      id: "child-1",
      parentId: "user-1",
      ancestors: ["user-1"],
    });
    repo.findById.mockResolvedValue(child as never);
    repo.countChildren.mockResolvedValue(2 as never);

    await expect(
      userService.deleteSubUser("user-1", "child-1"),
    ).rejects.toThrow("Cannot delete a sub-user that has their own sub-users.");
  });
});
