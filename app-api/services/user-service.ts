import { hashPassword } from "@/lib/password";
import { userRepository } from "@/repositories/user-repository";
import type { CreateUserInput, UpdateUserInput, UserRecord } from "@/types";

const allowedRoles = ["admin", "editor"];
const allowedStatuses = ["active", "disabled"];

function cleanEmail(email: string) {
  return String(email || "")
    .toLowerCase()
    .trim();
}

function safeUser(
  user: (UserRecord & { passwordHash?: string }) | null,
): UserRecord | null {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

export const userService = {
  list: userRepository.list,
  getById: userRepository.findById,
  async create(input: CreateUserInput): Promise<UserRecord | null> {
    const email = cleanEmail(input.email);

    if (!input.name || !email || !input.password) {
      throw new Error("Name, email, and password are required.");
    }

    if (!allowedRoles.includes(input.role)) {
      throw new Error("Invalid role.");
    }

    const user = await userRepository.create({
      name: input.name,
      email,
      passwordHash: hashPassword(input.password),
      role: input.role,
      status: allowedStatuses.includes(input.status ?? "")
        ? input.status!
        : "active",
    });

    return safeUser(user);
  },
  async update(id: string, input: UpdateUserInput): Promise<UserRecord | null> {
    const current = await userRepository.findById(id);
    if (!current) throw new Error("User not found.");

    const nextRole = input.role || current.role;
    const nextStatus = input.status || current.status;

    if (!allowedRoles.includes(nextRole)) throw new Error("Invalid role.");
    if (!allowedStatuses.includes(nextStatus))
      throw new Error("Invalid status.");

    if (
      current.role === "admin" &&
      (nextRole !== "admin" || nextStatus !== "active")
    ) {
      const otherAdmins = await userRepository.countAdmins(id);
      if (otherAdmins < 1)
        throw new Error("At least one active admin user is required.");
    }

    const data: Record<string, string> = {
      name: input.name || current.name,
      email: input.email ? cleanEmail(input.email) : current.email,
      role: nextRole,
      status: nextStatus,
    };

    if (input.password) {
      data.passwordHash = hashPassword(input.password);
    }

    const user = await userRepository.update(id, data);
    return safeUser(user);
  },
  async delete(id: string): Promise<UserRecord | null> {
    const current = await userRepository.findById(id);
    if (!current) throw new Error("User not found.");

    if (current.role === "admin") {
      const otherAdmins = await userRepository.countAdmins(id);
      if (otherAdmins < 1)
        throw new Error("At least one active admin user is required.");
    }

    const deleted = await userRepository.delete(id);
    return safeUser(deleted);
  },
};
