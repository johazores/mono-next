export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role: string;
  status?: string;
};

export type UpdateUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  status?: string;
};
