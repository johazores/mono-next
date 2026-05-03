import { apiGet } from "./api-client";
import type { PublicAuthConfig } from "@/types";

export const settingService = {
  async getAuthConfig() {
    return apiGet<PublicAuthConfig>("/api/settings/auth");
  },
};
