import type { AccountStatus } from "./auth";

export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  status: AccountStatus;
  plan: SubscriptionPlan;
  subscriptionId: string | null;
  subscriptionEnds: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  plan?: SubscriptionPlan;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  status?: AccountStatus;
  plan?: SubscriptionPlan;
  subscriptionId?: string;
  subscriptionEnds?: string;
};

export type UpdateUserProfileInput = {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
};

export type UserAuthSession = {
  user: {
    id: string;
    name: string;
    email: string;
    status: AccountStatus;
    plan: SubscriptionPlan;
    subscriptionEnds: Date | null;
  };
};
