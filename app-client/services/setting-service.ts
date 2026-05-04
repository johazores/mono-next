import { apiGet } from "./api-client";
import type { PublicAuthConfig, SiteConfig } from "@/types";

export const settingService = {
  async getAuthConfig() {
    return apiGet<PublicAuthConfig>("/api/settings/auth");
  },

  async getSiteConfig() {
    return apiGet<SiteConfig>("/api/settings/site");
  },
};
