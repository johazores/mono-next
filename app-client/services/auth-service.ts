import { apiPost, apiGet } from "./api-client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export const authService = {
  async login(email: string, password: string) {
    return apiPost<AuthUser>("/api/auth/login", { email, password });
  },
  async logout() {
    return apiPost("/api/auth/logout");
  },
  async me() {
    return apiGet<AuthUser>("/api/auth/me");
  },
};
