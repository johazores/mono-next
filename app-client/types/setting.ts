export type AuthProvider = "credentials" | "clerk";

export type PublicAuthConfig = {
  provider: AuthProvider;
  clerkPublishableKey: string;
};
