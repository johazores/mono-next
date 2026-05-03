import { apiPost, apiGet } from "./api-client";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  plan: string;
  subscriptionEnds: string | null;
};

export const userAuthService = {
  async register(name: string, email: string, password: string) {
    return apiPost<AppUser>("/api/users/auth/register", {
      name,
      email,
      password,
    });
  },
  async login(email: string, password: string) {
    return apiPost<AppUser>("/api/users/auth/login", { email, password });
  },
  async logout() {
    return apiPost("/api/users/auth/logout");
  },
  async me() {
    return apiGet<AppUser>("/api/users/auth/me");
  },
};
