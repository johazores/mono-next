import { apiPost, apiGet, apiPut } from "./api-client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export type UpdateAdminProfileInput = {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
};

export const authService = {
  async login(email: string, password: string) {
    return apiPost<AuthUser>("/api/panel/login", { email, password });
  },
  async logout() {
    return apiPost("/api/panel/logout");
  },
  async me() {
    return apiGet<AuthUser>("/api/panel/me");
  },
  async getProfile() {
    return apiGet<AuthUser>("/api/panel/profile");
  },
  async updateProfile(input: UpdateAdminProfileInput) {
    return apiPut<AuthUser>("/api/panel/profile", input);
  },
};
