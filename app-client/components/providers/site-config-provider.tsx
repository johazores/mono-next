"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { settingService } from "@/services/setting-service";
import type { SiteConfig, ThemeTokens } from "@/types";

const TOKEN_TO_VAR: Record<keyof ThemeTokens, string> = {
  primary: "--theme-primary",
  primaryHover: "--theme-primary-hover",
  accent: "--theme-accent",
  background: "--theme-background",
  surface: "--theme-surface",
  border: "--theme-border",
  text: "--theme-text",
  textMuted: "--theme-text-muted",
  success: "--theme-success",
  error: "--theme-error",
  warning: "--theme-warning",
  info: "--theme-info",
};

const DEFAULT_CONFIG: SiteConfig = {
  title: "mono-next",
  tagline: "",
  favicon: "",
  logo: "",
  logoDark: "",
  theme: {},
};

const SiteConfigContext = createContext<SiteConfig>(DEFAULT_CONFIG);

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

function applyThemeVars(theme: ThemeTokens) {
  const root = document.documentElement;
  for (const [token, cssVar] of Object.entries(TOKEN_TO_VAR)) {
    const value = theme[token as keyof ThemeTokens];
    if (value) {
      root.style.setProperty(cssVar, value);
    } else {
      root.style.removeProperty(cssVar);
    }
  }
}

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    settingService
      .getSiteConfig()
      .then((res) => {
        if (res.ok && res.data) {
          setConfig(res.data);
          applyThemeVars(res.data.theme);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <SiteConfigContext.Provider value={config}>
      {children}
    </SiteConfigContext.Provider>
  );
}
