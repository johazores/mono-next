import type { Role, AccountStatus } from "./auth";

export type AdminRecord = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateAdminInput = {
  name: string;
  email: string;
  password: string;
  role: Role;
  status?: AccountStatus;
};

export type UpdateAdminInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: Role;
  status?: AccountStatus;
};
