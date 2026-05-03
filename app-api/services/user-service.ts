import { hashPassword, verifyPassword, DUMMY_HASH } from "@/lib/password";
import { userRepository } from "@/repositories/user-repository";
import { subscriptionRepository } from "@/repositories/subscription-repository";
import { planRepository } from "@/repositories/plan-repository";
import type {
  UserRecord,
  CreateUserInput,
  UpdateUserInput,
  UpdateUserProfileInput,
  AccountStatus,
} from "@/types";

const allowedStatuses: AccountStatus[] = ["active", "disabled"];

function cleanEmail(email: string) {
  return String(email || "")
    .toLowerCase()
    .trim();
}

function safeUser(
  user: (Record<string, unknown> & { passwordHash?: string }) | null,
): UserRecord | null {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe as UserRecord;
}

async function enrichWithPlan(
  user: UserRecord | null,
): Promise<UserRecord | null> {
  if (!user) return null;
  const sub = await subscriptionRepository.findActiveByUserId(user.id);
  if (sub) {
    user.activePlan = {
      id: sub.plan.id,
      name: sub.plan.name,
      slug: sub.plan.slug,
      subscriptionId: sub.id,
      endDate: sub.endDate,
    };
  } else {
    user.activePlan = null;
  }
  return user;
}

export const userService = {
  async list() {
    const users = await userRepository.list();
    const enriched = await Promise.all(
      (users as UserRecord[]).map((u) => enrichWithPlan(u)),
    );
    return enriched;
  },

  async getById(id: string) {
    const user = await userRepository.findById(id);
    return enrichWithPlan(safeUser(user as Record<string, unknown>));
  },

  async authenticate(email: string, password: string): Promise<UserRecord> {
    const cleanedEmail = cleanEmail(email);
    if (!cleanedEmail || !password) {
      throw new Error("Email and password are required.");
    }

    const user = await userRepository.findByEmailWithPassword(cleanedEmail);

    // Always run password verification to prevent timing-based user enumeration
    const hashToCheck = user?.passwordHash ?? DUMMY_HASH;
    const passwordValid = verifyPassword(password, hashToCheck);

    if (!user || !passwordValid) {
      throw new Error("Invalid email or password.");
    }

    if (user.status !== "active") {
      throw new Error("This account is disabled.");
    }

    await userRepository.touchLastLogin(user.id);
    const safe = safeUser(user)!;
    return (await enrichWithPlan(safe))!;
  },

  async register(input: CreateUserInput): Promise<UserRecord | null> {
    const email = cleanEmail(input.email);

    if (!input.name || !email || !input.password) {
      throw new Error("Name, email, and password are required.");
    }

    const user = await userRepository.create({
      name: input.name,
      email,
      passwordHash: hashPassword(input.password),
    });

    const safe = safeUser(user);
    if (!safe) return null;

    // Assign free plan subscription
    const freePlan = await planRepository.findBySlug("free");
    if (freePlan) {
      await subscriptionRepository.create({
        user: { connect: { id: safe.id } },
        plan: { connect: { id: freePlan.id } },
      });
    }

    return enrichWithPlan(safe);
  },

  async update(id: string, input: UpdateUserInput): Promise<UserRecord | null> {
    const current = await userRepository.findById(id);
    if (!current) throw new Error("User not found.");

    const nextStatus =
      input.status || ((current as Record<string, unknown>).status as string);

    if (!(allowedStatuses as string[]).includes(nextStatus))
      throw new Error("Invalid status.");

    const data: Record<string, unknown> = {
      name: input.name || (current as Record<string, unknown>).name,
      email: input.email
        ? cleanEmail(input.email)
        : (current as Record<string, unknown>).email,
      status: nextStatus,
    };

    if (input.password) {
      data.passwordHash = hashPassword(input.password);
    }

    const user = await userRepository.update(id, data);
    return enrichWithPlan(safeUser(user));
  },

  async delete(id: string): Promise<UserRecord | null> {
    const current = await userRepository.findById(id);
    if (!current) throw new Error("User not found.");

    const deleted = await userRepository.delete(id);
    return safeUser(deleted);
  },

  async updateProfile(
    id: string,
    input: UpdateUserProfileInput,
  ): Promise<UserRecord | null> {
    const current = await userRepository.findByIdWithPassword(id);
    if (!current) throw new Error("User not found.");

    const data: Record<string, unknown> = {};

    if (input.name) {
      const name = input.name.trim();
      if (name.length < 2 || name.length > 100)
        throw new Error("Name must be between 2 and 100 characters.");
      data.name = name;
    }

    if (input.email) {
      const email = cleanEmail(input.email);
      if (!email) throw new Error("Invalid email address.");
      if (email !== current.email) {
        const existing = await userRepository.findByEmailWithPassword(email);
        if (existing) throw new Error("Email is already in use.");
        data.email = email;
      }
    }

    if (input.newPassword) {
      if (!input.currentPassword)
        throw new Error("Current password is required to set a new password.");
      if (!verifyPassword(input.currentPassword, current.passwordHash))
        throw new Error("Current password is incorrect.");
      data.passwordHash = hashPassword(input.newPassword);
    }

    if (Object.keys(data).length === 0) throw new Error("No fields to update.");

    const user = await userRepository.update(id, data);
    return enrichWithPlan(safeUser(user));
  },
};
