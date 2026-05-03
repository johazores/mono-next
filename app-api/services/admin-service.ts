import { hashPassword, verifyPassword } from "@/lib/password";
import { adminRepository } from "@/repositories/admin-repository";
import type {
  AdminRecord,
  CreateAdminInput,
  UpdateAdminInput,
  UpdateAdminProfileInput,
  Role,
  AccountStatus,
} from "@/types";

const allowedRoles: Role[] = ["admin", "editor"];
const allowedStatuses: AccountStatus[] = ["active", "disabled"];

function cleanEmail(email: string) {
  return String(email || "")
    .toLowerCase()
    .trim();
}

function safeAdmin(
  admin: (Record<string, unknown> & { passwordHash?: string }) | null,
): AdminRecord | null {
  if (!admin) return null;
  const { passwordHash, ...safe } = admin;
  return safe as AdminRecord;
}

export const adminService = {
  list: adminRepository.list,
  getById: adminRepository.findById,
  async authenticate(email: string, password: string): Promise<AdminRecord> {
    const cleanedEmail = cleanEmail(email);
    if (!cleanedEmail || !password) {
      throw new Error("Email and password are required.");
    }

    const admin = await adminRepository.findByEmailWithPassword(cleanedEmail);
    if (!admin) throw new Error("Invalid email or password.");

    if (!verifyPassword(password, admin.passwordHash)) {
      throw new Error("Invalid email or password.");
    }

    if (admin.status !== "active") {
      throw new Error("This account is disabled.");
    }

    await adminRepository.touchLastLogin(admin.id);
    return safeAdmin(admin)!;
  },
  async create(input: CreateAdminInput): Promise<AdminRecord | null> {
    const email = cleanEmail(input.email);

    if (!input.name || !email || !input.password) {
      throw new Error("Name, email, and password are required.");
    }

    if (!(allowedRoles as string[]).includes(input.role)) {
      throw new Error("Invalid role.");
    }

    const admin = await adminRepository.create({
      name: input.name,
      email,
      passwordHash: hashPassword(input.password),
      role: input.role,
      status: (allowedStatuses as string[]).includes(input.status ?? "")
        ? input.status!
        : "active",
    });

    return safeAdmin(admin);
  },
  async update(
    id: string,
    input: UpdateAdminInput,
  ): Promise<AdminRecord | null> {
    const current = await adminRepository.findById(id);
    if (!current) throw new Error("Admin not found.");

    const nextRole = input.role || current.role;
    const nextStatus = input.status || current.status;

    if (!(allowedRoles as string[]).includes(nextRole))
      throw new Error("Invalid role.");
    if (!(allowedStatuses as string[]).includes(nextStatus))
      throw new Error("Invalid status.");

    if (
      current.role === "admin" &&
      (nextRole !== "admin" || nextStatus !== "active")
    ) {
      const otherAdmins = await adminRepository.countAdmins(id);
      if (otherAdmins < 1)
        throw new Error("At least one active admin is required.");
    }

    const admin = await adminRepository.update(id, {
      name: input.name || current.name,
      email: input.email ? cleanEmail(input.email) : current.email,
      role: nextRole,
      status: nextStatus,
      ...(input.password ? { passwordHash: hashPassword(input.password) } : {}),
    });
    return safeAdmin(admin);
  },
  async delete(id: string): Promise<AdminRecord | null> {
    const current = await adminRepository.findById(id);
    if (!current) throw new Error("Admin not found.");

    if (current.role === "admin") {
      const otherAdmins = await adminRepository.countAdmins(id);
      if (otherAdmins < 1)
        throw new Error("At least one active admin is required.");
    }

    const deleted = await adminRepository.delete(id);
    return safeAdmin(deleted);
  },

  async updateProfile(
    id: string,
    input: UpdateAdminProfileInput,
  ): Promise<AdminRecord | null> {
    const current = await adminRepository.findByIdWithPassword(id);
    if (!current) throw new Error("Admin not found.");

    const data: Record<string, unknown> = {};

    if (input.name) {
      const name = input.name.trim();
      if (name.length < 2 || name.length > 100)
        throw new Error("Name must be between 2 and 100 characters.");
      data.name = name;
    }

    if (input.newPassword) {
      if (!input.currentPassword)
        throw new Error("Current password is required to set a new password.");
      if (!verifyPassword(input.currentPassword, current.passwordHash))
        throw new Error("Current password is incorrect.");
      data.passwordHash = hashPassword(input.newPassword);
    }

    if (Object.keys(data).length === 0) throw new Error("No fields to update.");

    const admin = await adminRepository.update(id, data);
    return safeAdmin(admin);
  },
};
