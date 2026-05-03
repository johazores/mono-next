export type Role = "admin" | "editor";
export type AccountStatus = "active" | "disabled";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: AccountStatus;
};

export type AuthSession = {
  admin: AuthUser;
};
