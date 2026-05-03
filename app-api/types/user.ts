import type { AccountStatus } from "./auth";

export type UserRecord = {
  id: string;
  email: string;
  name: string;
  status: AccountStatus;
  parentId: string | null;
  ancestors: string[];
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  activePlan?: {
    id: string;
    name: string;
    slug: string;
    purchaseId: string;
    endDate: Date | null;
  } | null;
};

export type CreateSubUserInput = {
  name: string;
  email: string;
  password: string;
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
    parentId: string | null;
    parent: { name: string; email: string } | null;
    activePlan: {
      name: string;
      slug: string;
      endDate: Date | null;
    } | null;
  };
};
