export type Role = "admin" | "editor";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: string;
};

export type AuthSession = {
  user: AuthUser;
};
