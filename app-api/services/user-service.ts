import { hashPassword, verifyPassword } from "@/lib/password";
import { userRepository } from "@/repositories/user-repository";
import type {
  UserRecord,
  CreateUserInput,
  UpdateUserInput,
  SubscriptionPlan,
  AccountStatus,
} from "@/types";

const allowedPlans: SubscriptionPlan[] = [
  "free",
  "starter",
  "pro",
  "enterprise",
];
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

export const userService = {
  list: userRepository.list,
  getById: userRepository.findById,

  async authenticate(email: string, password: string): Promise<UserRecord> {
    const cleanedEmail = cleanEmail(email);
    if (!cleanedEmail || !password) {
      throw new Error("Email and password are required.");
    }

    const user = await userRepository.findByEmailWithPassword(cleanedEmail);
    if (!user) throw new Error("Invalid email or password.");

    if (!verifyPassword(password, user.passwordHash)) {
      throw new Error("Invalid email or password.");
    }

    if (user.status !== "active") {
      throw new Error("This account is disabled.");
    }

    await userRepository.touchLastLogin(user.id);
    return safeUser(user)!;
  },

  async register(input: CreateUserInput): Promise<UserRecord | null> {
    const email = cleanEmail(input.email);

    if (!input.name || !email || !input.password) {
      throw new Error("Name, email, and password are required.");
    }

    const plan = allowedPlans.includes(input.plan as SubscriptionPlan)
      ? (input.plan as SubscriptionPlan)
      : "free";

    const user = await userRepository.create({
      name: input.name,
      email,
      passwordHash: hashPassword(input.password),
      plan,
    });

    return safeUser(user);
  },

  async update(id: string, input: UpdateUserInput): Promise<UserRecord | null> {
    const current = await userRepository.findById(id);
    if (!current) throw new Error("User not found.");

    const nextStatus = input.status || current.status;
    const nextPlan = input.plan || current.plan;

    if (!(allowedStatuses as string[]).includes(nextStatus))
      throw new Error("Invalid status.");
    if (!(allowedPlans as string[]).includes(nextPlan))
      throw new Error("Invalid plan.");

    const data: Record<string, unknown> = {
      name: input.name || current.name,
      email: input.email ? cleanEmail(input.email) : current.email,
      status: nextStatus,
      plan: nextPlan,
    };

    if (input.password) {
      data.passwordHash = hashPassword(input.password);
    }

    if (input.subscriptionId !== undefined) {
      data.subscriptionId = input.subscriptionId || null;
    }

    if (input.subscriptionEnds !== undefined) {
      data.subscriptionEnds = input.subscriptionEnds
        ? new Date(input.subscriptionEnds)
        : null;
    }

    const user = await userRepository.update(id, data);
    return safeUser(user);
  },

  async delete(id: string): Promise<UserRecord | null> {
    const current = await userRepository.findById(id);
    if (!current) throw new Error("User not found.");

    const deleted = await userRepository.delete(id);
    return safeUser(deleted);
  },
};
