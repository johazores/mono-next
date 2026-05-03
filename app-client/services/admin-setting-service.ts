import { apiGet, apiPut } from "./api-client";

type SettingItem = { key: string; value: unknown };

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
