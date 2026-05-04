import { apiGet, apiPut } from "./api-client";
import type { SettingItem } from "@/types";

export const adminSettingService = {
  async getAll() {
    return apiGet<{ items: SettingItem[] }>("/api/panel/settings");
  },

  async update(key: string, value: unknown) {
    return apiPut<{ key: string; value: unknown }>(
      `/api/panel/settings/${encodeURIComponent(key)}`,
      { value },
    );
  },
};
