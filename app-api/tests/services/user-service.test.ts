import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword } from "@/lib/password";

vi.mock("@/repositories/user-repository", () => ({
  userRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    findByIdWithPassword: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    touchLastLogin: vi.fn(),
  },
}));

import { userService } from "@/services/user-service";
import { userRepository } from "@/repositories/user-repository";

const repo = vi.mocked(userRepository);

const now = new Date();

function fakeUser(overrides = {}) {
  return {
    id: "user-1",
    name: "Test User",
    email: "user@test.com",
    passwordHash: hashPassword("CorrectPass1!"),
    status: "active",
    plan: "starter",
    subscriptionId: null,
    subscriptionEnds: null,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
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
      userService.authenticate("user@test.com", "WrongPassword!"),
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

  it("defaults to free plan for invalid plan", async () => {
    repo.create.mockResolvedValue(fakeUser({ plan: "free" }) as never);

    await userService.register({
      name: "Test",
      email: "new@test.com",
      password: "ValidPass1!",
      plan: "nonexistent" as never,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ plan: "free" }),
    );
  });

  it("creates user with valid plan", async () => {
    repo.create.mockResolvedValue(fakeUser() as never);

    const result = await userService.register({
      name: "Test User",
      email: "USER@TEST.COM",
      password: "ValidPass1!",
      plan: "starter",
    });

    expect(result).not.toHaveProperty("passwordHash");
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test User",
        email: "user@test.com",
        plan: "starter",
      }),
    );
  });
});

describe("userService.update", () => {
  it("rejects invalid status", async () => {
    repo.findById.mockResolvedValue(fakeUser() as never);
    await expect(
      userService.update("user-1", { status: "banned" as never }),
    ).rejects.toThrow("Invalid status.");
  });

  it("rejects invalid plan", async () => {
    repo.findById.mockResolvedValue(fakeUser() as never);
    await expect(
      userService.update("user-1", { plan: "premium" as never }),
    ).rejects.toThrow("Invalid plan.");
  });

  it("updates user with valid input", async () => {
    repo.findById.mockResolvedValue(fakeUser() as never);
    repo.update.mockResolvedValue(fakeUser({ plan: "pro" }) as never);

    const result = await userService.update("user-1", { plan: "pro" });
    expect(result?.plan).toBe("pro");
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
