import type { AccountStatus } from "./auth";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  status: AccountStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  activePlan?: {
    id: string;
    name: string;
    slug: string;
    subscriptionId: string;
    endDate: Date | null;
  } | null;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  status?: AccountStatus;
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
    activePlan: {
      name: string;
      slug: string;
      endDate: Date | null;
    } | null;
  };
};
