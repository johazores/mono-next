export type AdminRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateAdminInput = {
  name: string;
  email: string;
  password: string;
  role: string;
  status?: string;
};

export type UpdateAdminInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
};
