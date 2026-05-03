import { hashPassword, verifyPassword, DUMMY_HASH } from "@/lib/password";
import { userRepository } from "@/repositories/user-repository";
import { purchaseRepository } from "@/repositories/purchase-repository";
import { productRepository } from "@/repositories/product-repository";
import type {
  UserRecord,
  CreateUserInput,
  CreateSubUserInput,
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
  const sub = await purchaseRepository.findActiveSubscription(user.id);
  if (sub) {
    user.activePlan = {
      id: sub.product.id,
      name: sub.product.name,
      slug: sub.product.slug,
      purchaseId: sub.id,
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

    // Assign free product subscription
    const freeProduct = await productRepository.findBySlug("free");
    if (freeProduct) {
      const purchase = await purchaseRepository.create({
        user: { connect: { id: safe.id } },
        product: { connect: { id: freeProduct.id } },
        amount: 0,
        currency: freeProduct.currency,
        status: "active",
      });

      // Grant membership from free product features
      if (freeProduct.accessKeys.length > 0) {
        const { membershipService } =
          await import("@/services/membership-service");
        await membershipService.grantFromPurchase(
          safe.id,
          purchase.id,
          freeProduct.accessKeys,
        );
      }
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

  async createSubUser(
    parentId: string,
    input: CreateSubUserInput,
  ): Promise<UserRecord | null> {
    const parent = await userRepository.findById(parentId);
    if (!parent) throw new Error("Parent user not found.");

    // Sub-users can only create their own sub-users if they have an
    // independent subscription whose product includes sub-users.create
    // and allows sub-users (maxSubUsers != 0).
    const parentRecord = parent as UserRecord;
    const creatorSub =
      await purchaseRepository.findActiveSubscription(parentId);
    if (!creatorSub)
      throw new Error("No active subscription. Cannot create sub-users.");

    if (parentRecord.parentId) {
      const ownProduct = creatorSub.product as Record<string, unknown>;
      const ownMax = (ownProduct.maxSubUsers as number) ?? 0;
      const ownKeys = (ownProduct.accessKeys as string[]) ?? [];

      if (ownMax === 0 || !ownKeys.includes("sub-users.create")) {
        throw new Error("Sub-users cannot create their own sub-users.");
      }
    }

    const product = creatorSub.product;
    const maxSubUsers = (product as Record<string, unknown>)
      .maxSubUsers as number;

    if (maxSubUsers === 0) {
      throw new Error("Your plan does not allow sub-users.");
    }

    if (maxSubUsers > 0) {
      // Count all descendants under the creator, not just direct children
      const descendants = await userRepository.findDescendants(parentId);
      if (descendants.length >= maxSubUsers) {
        throw new Error(
          `Sub-user limit reached (${maxSubUsers}). Upgrade your plan for more.`,
        );
      }
    }
    // maxSubUsers === -1 means unlimited

    const email = cleanEmail(input.email);
    if (!input.name || !email || !input.password) {
      throw new Error("Name, email, and password are required.");
    }

    const ancestors = [parentId];

    const user = await userRepository.create({
      name: input.name,
      email,
      passwordHash: hashPassword(input.password),
      parent: { connect: { id: parentId } },
      ancestors,
    });

    const safe = safeUser(user);
    if (!safe) return null;

    // Sub-users inherit creator's subscription — assign same product
    const subPurchase = await purchaseRepository.create({
      user: { connect: { id: safe.id } },
      product: { connect: { id: creatorSub.productId } },
      amount: 0,
      currency: creatorSub.currency,
      status: "active",
    });

    // Grant membership from product features
    const accessKeys = (product as Record<string, unknown>)
      .accessKeys as string[];
    if (accessKeys?.length > 0) {
      const { membershipService } =
        await import("@/services/membership-service");
      await membershipService.grantFromPurchase(
        safe.id,
        subPurchase.id,
        accessKeys,
      );
    }

    return enrichWithPlan(safe);
  },

  async listSubUsers(parentId: string): Promise<UserRecord[]> {
    const children = await userRepository.findByParentId(parentId);
    const enriched = await Promise.all(
      (children as UserRecord[]).map((u) => enrichWithPlan(u)),
    );
    return enriched.filter(Boolean) as UserRecord[];
  },

  async revokeSubUser(
    parentId: string,
    subUserId: string,
  ): Promise<UserRecord | null> {
    const subUser = await userRepository.findById(subUserId);
    if (!subUser) throw new Error("Sub-user not found.");

    const record = subUser as UserRecord;
    if (record.parentId !== parentId) {
      throw new Error("This user is not your sub-user.");
    }

    // Check if sub-user has children — prevent orphaning
    const childCount = await userRepository.countChildren(subUserId);
    if (childCount > 0) {
      throw new Error(
        "Cannot revoke a sub-user that has their own sub-users. Remove their sub-users first.",
      );
    }

    // Revoke the inherited purchase (amount=0) and its membership so the
    // sub-user no longer retains benefits from the parent's subscription.
    const purchases = await purchaseRepository.findByUserId(subUserId);
    const inherited = purchases.find(
      (p) => p.amount === 0 && p.status === "active",
    );
    if (inherited) {
      await purchaseRepository.update(inherited.id, {
        status: "cancelled",
        cancelledAt: new Date(),
      });
      const { membershipService } =
        await import("@/services/membership-service");
      await membershipService.revokeBySource(inherited.id);
    }

    // Detach from parent — the user keeps their account and any independent
    // purchases/memberships but loses inherited features from the parent.
    const updated = await userRepository.update(subUserId, {
      parent: { disconnect: true },
      ancestors: { set: [] },
    });
    return safeUser(updated);
  },
};
