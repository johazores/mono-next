export type { AppEnv } from "@/lib/env";

export type AuthProvider = "credentials" | "clerk";

export type AuthConfig = {
  provider: AuthProvider;
  clerkPublishableKey: string;
  clerkSecretKey: string;
};

export type PublicAuthConfig = {
  provider: AuthProvider;
  clerkPublishableKey: string;
};

export type SettingRecord = {
  id: string;
  key: string;
  value: unknown;
  createdAt: Date;
  updatedAt: Date;
};
