"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { ClerkProvider, useAuth } from "@clerk/react";
import { settingService } from "@/services/setting-service";
import { setTokenGetter } from "@/services/api-client";
import type { AuthProvider, PublicAuthConfig } from "@/types";

type AuthConfigContextValue = {
  provider: AuthProvider;
  clerkPublishableKey: string;
  ready: boolean;
  getToken: () => Promise<string | null>;
};

const AuthConfigContext = createContext<AuthConfigContextValue>({
  provider: "credentials",
  clerkPublishableKey: "",
  ready: false,
  getToken: async () => null,
});

export function useAuthConfig() {
  return useContext(AuthConfigContext);
}

/** Bridges Clerk's useAuth into the shared AuthConfigContext. */
function ClerkTokenBridge({ children }: { children: ReactNode }) {
  const { getToken, isLoaded } = useAuth();
  const config = useContext(AuthConfigContext);

  // Register the token getter synchronously during render so it is
  // available before any child effects (e.g. the layout's /me call).
  // setTokenGetter just assigns a module-level variable — idempotent,
  // no DOM mutation, safe to call during render.
  if (isLoaded) {
    setTokenGetter(() => getToken());
  }

  return (
    <AuthConfigContext.Provider
      value={{ ...config, ready: isLoaded, getToken: () => getToken() }}
    >
      {children}
    </AuthConfigContext.Provider>
  );
}

export function AuthConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PublicAuthConfig | null>(null);

  useEffect(() => {
    settingService
      .getAuthConfig()
      .then((res) => {
        if (res.ok && res.data) {
          setConfig(res.data);
        } else {
          setConfig({ provider: "credentials", clerkPublishableKey: "" });
        }
      })
      .catch(() => {
        setConfig({ provider: "credentials", clerkPublishableKey: "" });
      });
  }, []);

  if (!config) {
    return null;
  }

  if (config.provider === "clerk" && config.clerkPublishableKey) {
    return (
      <AuthConfigContext.Provider
        value={{
          provider: "clerk",
          clerkPublishableKey: config.clerkPublishableKey,
          ready: false,
          getToken: async () => null,
        }}
      >
        <ClerkProvider
          publishableKey={config.clerkPublishableKey}
          signInUrl="/user-login"
          signUpUrl="/user-register"
        >
          <ClerkTokenBridge>{children}</ClerkTokenBridge>
        </ClerkProvider>
      </AuthConfigContext.Provider>
    );
  }

  // Clerk mode is set but publishable key is missing — show error instead
  // of silently falling back to credential forms that the server will reject
  if (config.provider === "clerk" && !config.clerkPublishableKey) {
    return (
      <AuthConfigContext.Provider
        value={{
          provider: "clerk",
          clerkPublishableKey: "",
          ready: true,
          getToken: async () => null,
        }}
      >
        {children}
      </AuthConfigContext.Provider>
    );
  }

  return (
    <AuthConfigContext.Provider
      value={{
        provider: "credentials",
        clerkPublishableKey: "",
        ready: true,
        getToken: async () => null,
      }}
    >
      {children}
    </AuthConfigContext.Provider>
  );
}
