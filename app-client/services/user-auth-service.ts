import { apiPost, apiGet, apiPut } from "./api-client";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  parentId: string | null;
  parent: { name: string; email: string } | null;
  activePlan: {
    name: string;
    slug: string;
    endDate: string | null;
  } | null;
};

export type UpdateUserProfileInput = {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
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
  async getProfile() {
    return apiGet<AppUser>("/api/users/auth/profile");
  },
  async updateProfile(input: UpdateUserProfileInput) {
    return apiPut<AppUser>("/api/users/auth/profile", input);
  },
};
