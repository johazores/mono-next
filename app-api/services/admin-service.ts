import { hashPassword, verifyPassword } from "@/lib/password";
import { adminRepository } from "@/repositories/admin-repository";
import type { AdminRecord, CreateAdminInput, UpdateAdminInput } from "@/types";

const allowedRoles = ["admin", "editor"];
const allowedStatuses = ["active", "disabled"];

function cleanEmail(email: string) {
  return String(email || "")
    .toLowerCase()
    .trim();
}

function safeAdmin(
  admin: (AdminRecord & { passwordHash?: string }) | null,
): AdminRecord | null {
  if (!admin) return null;
  const { passwordHash, ...safe } = admin;
  return safe;
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

    if (!allowedRoles.includes(input.role)) {
      throw new Error("Invalid role.");
    }

    const admin = await adminRepository.create({
      name: input.name,
      email,
      passwordHash: hashPassword(input.password),
      role: input.role,
      status: allowedStatuses.includes(input.status ?? "")
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

    if (!allowedRoles.includes(nextRole)) throw new Error("Invalid role.");
    if (!allowedStatuses.includes(nextStatus))
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
};
