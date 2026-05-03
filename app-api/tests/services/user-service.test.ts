import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword } from "@/lib/password";

vi.mock("@/repositories/user-repository", () => ({
  userRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    findByIdWithPassword: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    touchLastLogin: vi.fn(),
  },
}));

vi.mock("@/repositories/subscription-repository", () => ({
  subscriptionRepository: {
    findByUserId: vi.fn(),
    findActiveByUserId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    cancelActiveByUserId: vi.fn(),
    findExpired: vi.fn(),
    expireBatch: vi.fn(),
  },
}));

vi.mock("@/repositories/plan-repository", () => ({
  planRepository: {
    list: vi.fn(),
    listAll: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    countActiveSubscriptions: vi.fn(),
  },
}));

import { userService } from "@/services/user-service";
import { userRepository } from "@/repositories/user-repository";
import { subscriptionRepository } from "@/repositories/subscription-repository";
import { planRepository } from "@/repositories/plan-repository";

const repo = vi.mocked(userRepository);
const subRepo = vi.mocked(subscriptionRepository);
const planRepo = vi.mocked(planRepository);

const now = new Date();

function fakeUser(overrides = {}) {
  return {
    id: "user-1",
    name: "Test User",
    email: "user@test.com",
    passwordHash: hashPassword("CorrectPass1!"),
    status: "active",
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Default: no active subscription
  subRepo.findActiveByUserId.mockResolvedValue(null as never);
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

  it("creates user and assigns free plan", async () => {
    repo.create.mockResolvedValue(fakeUser() as never);
    planRepo.findBySlug.mockResolvedValue({
      id: "plan-free",
      slug: "free",
    } as never);
    subRepo.create.mockResolvedValue({} as never);

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
    expect(planRepo.findBySlug).toHaveBeenCalledWith("free");
    expect(subRepo.create).toHaveBeenCalled();
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
