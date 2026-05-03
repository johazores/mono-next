import { settingRepository } from "@/repositories/setting-repository";
import type { AuthConfig, AuthProvider, PublicAuthConfig } from "@/types";

const ALLOWED_KEYS = new Set([
  "auth.provider",
  "auth.clerkPublishableKey",
  "auth.clerkSecretKey",
]);

const AUTH_DEFAULTS: AuthConfig = {
  provider: "credentials",
  clerkPublishableKey: "",
  clerkSecretKey: "",
};

export const settingService = {
  async get(key: string): Promise<unknown> {
    const record = await settingRepository.get(key);
    return record?.value ?? null;
  },

  async set(key: string, value: unknown): Promise<void> {
    if (!ALLOWED_KEYS.has(key)) {
      throw new Error(`Unknown setting key: ${key}`);
    }

    if (key === "auth.provider") {
      const valid: AuthProvider[] = ["credentials", "clerk"];
      if (!valid.includes(value as AuthProvider)) {
        throw new Error(
          `Invalid auth provider. Must be one of: ${valid.join(", ")}`,
        );
      }
    }

    await settingRepository.set(key, value);
  },

  async getAll(): Promise<Array<{ key: string; value: unknown }>> {
    const records = await settingRepository.getAll();
    return records.map((r) => ({ key: r.key, value: r.value }));
  },

  async getAuthConfig(): Promise<AuthConfig> {
    const keys = [
      "auth.provider",
      "auth.clerkPublishableKey",
      "auth.clerkSecretKey",
    ];
    const records = await settingRepository.getMany(keys);
    const map = new Map(records.map((r) => [r.key, r.value]));

    return {
      provider:
        (map.get("auth.provider") as AuthProvider) ?? AUTH_DEFAULTS.provider,
      clerkPublishableKey:
        (map.get("auth.clerkPublishableKey") as string) ??
        AUTH_DEFAULTS.clerkPublishableKey,
      clerkSecretKey:
        (map.get("auth.clerkSecretKey") as string) ??
        AUTH_DEFAULTS.clerkSecretKey,
    };
  },

  async getPublicAuthConfig(): Promise<PublicAuthConfig> {
    const config = await this.getAuthConfig();
    return {
      provider: config.provider,
      clerkPublishableKey: config.clerkPublishableKey,
    };
  },
};
