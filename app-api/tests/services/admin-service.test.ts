import { describe, it, expect, vi, beforeEach } from "vitest";
import { hashPassword } from "@/lib/password";

// Mock the repository before importing the service
vi.mock("@/repositories/admin-repository", () => ({
  adminRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    findByIdWithPassword: vi.fn(),
    countAdmins: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    touchLastLogin: vi.fn(),
  },
}));

import { adminService } from "@/services/admin-service";
import { adminRepository } from "@/repositories/admin-repository";

const repo = vi.mocked(adminRepository);

const now = new Date();

function fakeAdmin(overrides = {}) {
  return {
    id: "admin-1",
    name: "Test Admin",
    email: "admin@test.com",
    passwordHash: hashPassword("CorrectPass1!"),
    role: "admin",
    status: "active",
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("adminService.authenticate", () => {
  it("returns admin without passwordHash on success", async () => {
    const admin = fakeAdmin();
    repo.findByEmailWithPassword.mockResolvedValue(admin as never);
    repo.touchLastLogin.mockResolvedValue(undefined as never);

    const result = await adminService.authenticate(
      "admin@test.com",
      "CorrectPass1!",
    );
    expect(result).not.toHaveProperty("passwordHash");
    expect(result.id).toBe("admin-1");
    expect(result.email).toBe("admin@test.com");
    expect(repo.touchLastLogin).toHaveBeenCalledWith("admin-1");
  });

  it("throws on empty email", async () => {
    await expect(adminService.authenticate("", "pass")).rejects.toThrow(
      "Email and password are required.",
    );
  });

  it("throws on empty password", async () => {
    await expect(adminService.authenticate("a@b.com", "")).rejects.toThrow(
      "Email and password are required.",
    );
  });

  it("throws on wrong password", async () => {
    repo.findByEmailWithPassword.mockResolvedValue(fakeAdmin() as never);
    await expect(
      adminService.authenticate("admin@test.com", "WrongPassword1!"),
    ).rejects.toThrow("Invalid email or password.");
  });

  it("throws on non-existent email", async () => {
    repo.findByEmailWithPassword.mockResolvedValue(null as never);
    await expect(
      adminService.authenticate("nobody@test.com", "Whatever1!"),
    ).rejects.toThrow("Invalid email or password.");
  });

  it("throws on disabled account", async () => {
    repo.findByEmailWithPassword.mockResolvedValue(
      fakeAdmin({ status: "disabled" }) as never,
    );
    await expect(
      adminService.authenticate("admin@test.com", "CorrectPass1!"),
    ).rejects.toThrow("This account is disabled.");
  });
});

describe("adminService.create", () => {
  it("validates required fields", async () => {
    await expect(
      adminService.create({
        name: "",
        email: "a@b.com",
        password: "ValidPass1!",
        role: "admin",
      }),
    ).rejects.toThrow("Name, email, and password are required.");
  });

  it("rejects invalid role", async () => {
    await expect(
      adminService.create({
        name: "Test",
        email: "a@b.com",
        password: "ValidPass1!",
        role: "superadmin" as never,
      }),
    ).rejects.toThrow("Invalid role.");
  });

  it("creates admin with valid input", async () => {
    const created = fakeAdmin();
    repo.create.mockResolvedValue(created as never);

    const result = await adminService.create({
      name: "Test Admin",
      email: "ADMIN@TEST.COM",
      password: "ValidPass1!",
      role: "admin",
    });

    expect(result).not.toHaveProperty("passwordHash");
    expect(result?.email).toBe("admin@test.com");
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Test Admin",
        email: "admin@test.com",
        role: "admin",
        status: "active",
      }),
    );
  });
});

describe("adminService.update", () => {
  it("prevents demoting the last admin", async () => {
    repo.findById.mockResolvedValue(fakeAdmin() as never);
    repo.countAdmins.mockResolvedValue(0 as never);

    await expect(
      adminService.update("admin-1", { role: "editor" }),
    ).rejects.toThrow("At least one active admin is required.");
  });

  it("prevents disabling the last admin", async () => {
    repo.findById.mockResolvedValue(fakeAdmin() as never);
    repo.countAdmins.mockResolvedValue(0 as never);

    await expect(
      adminService.update("admin-1", { status: "disabled" }),
    ).rejects.toThrow("At least one active admin is required.");
  });

  it("allows update when other admins exist", async () => {
    repo.findById.mockResolvedValue(fakeAdmin() as never);
    repo.countAdmins.mockResolvedValue(1 as never);
    repo.update.mockResolvedValue(fakeAdmin({ role: "editor" }) as never);

    const result = await adminService.update("admin-1", { role: "editor" });
    expect(result?.role).toBe("editor");
  });

  it("rejects invalid role", async () => {
    repo.findById.mockResolvedValue(fakeAdmin({ role: "editor" }) as never);

    await expect(
      adminService.update("admin-1", { role: "superadmin" as never }),
    ).rejects.toThrow("Invalid role.");
  });
});

describe("adminService.delete", () => {
  it("prevents deleting the last admin", async () => {
    repo.findById.mockResolvedValue(fakeAdmin() as never);
    repo.countAdmins.mockResolvedValue(0 as never);

    await expect(adminService.delete("admin-1")).rejects.toThrow(
      "At least one active admin is required.",
    );
  });

  it("allows deleting when other admins exist", async () => {
    repo.findById.mockResolvedValue(fakeAdmin() as never);
    repo.countAdmins.mockResolvedValue(1 as never);
    repo.delete.mockResolvedValue(fakeAdmin() as never);

    const result = await adminService.delete("admin-1");
    expect(result).not.toHaveProperty("passwordHash");
    expect(repo.delete).toHaveBeenCalledWith("admin-1");
  });

  it("throws on non-existent admin", async () => {
    repo.findById.mockResolvedValue(null as never);
    await expect(adminService.delete("missing")).rejects.toThrow(
      "Admin not found.",
    );
  });
});

describe("adminService.updateProfile", () => {
  it("updates name", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeAdmin() as never);
    repo.update.mockResolvedValue(fakeAdmin({ name: "New Name" }) as never);

    const result = await adminService.updateProfile("admin-1", {
      name: "New Name",
    });
    expect(result?.name).toBe("New Name");
  });

  it("rejects name shorter than 2 characters", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeAdmin() as never);
    await expect(
      adminService.updateProfile("admin-1", { name: "A" }),
    ).rejects.toThrow("Name must be between 2 and 100 characters.");
  });

  it("requires currentPassword to change password", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeAdmin() as never);
    await expect(
      adminService.updateProfile("admin-1", { newPassword: "NewPass123!" }),
    ).rejects.toThrow("Current password is required to set a new password.");
  });

  it("rejects incorrect currentPassword", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeAdmin() as never);
    await expect(
      adminService.updateProfile("admin-1", {
        currentPassword: "WrongOldPass!",
        newPassword: "NewPass123!",
      }),
    ).rejects.toThrow("Current password is incorrect.");
  });

  it("changes password with correct currentPassword", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeAdmin() as never);
    repo.update.mockResolvedValue(fakeAdmin() as never);

    await adminService.updateProfile("admin-1", {
      currentPassword: "CorrectPass1!",
      newPassword: "BrandNewPass1!",
    });

    expect(repo.update).toHaveBeenCalledWith(
      "admin-1",
      expect.objectContaining({
        passwordHash: expect.stringContaining("pbkdf2$"),
      }),
    );
  });

  it("throws when no fields to update", async () => {
    repo.findByIdWithPassword.mockResolvedValue(fakeAdmin() as never);
    await expect(adminService.updateProfile("admin-1", {})).rejects.toThrow(
      "No fields to update.",
    );
  });
});
