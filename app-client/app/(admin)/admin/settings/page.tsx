"use client";

import { useState, useEffect, type FormEvent } from "react";
import { adminSettingService } from "@/services/admin-setting-service";
import { PageHeader, Notice, Button } from "@/components/ui";
import type {
  AuthProvider,
  PaymentMode,
  AuthSettings,
  PaymentSettings,
  ThemeTokens,
} from "@/types";

const THEME_FIELDS: { key: keyof ThemeTokens; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "primaryHover", label: "Primary Hover" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "surface", label: "Surface" },
  { key: "border", label: "Border" },
  { key: "text", label: "Text" },
  { key: "textMuted", label: "Text Muted" },
  { key: "success", label: "Success" },
  { key: "error", label: "Error" },
  { key: "warning", label: "Warning" },
  { key: "info", label: "Info" },
];

const DEFAULT_THEME: ThemeTokens = {
  primary: "#2563eb",
  primaryHover: "#1d4ed8",
  accent: "#7c3aed",
  background: "#ffffff",
  surface: "#f9fafb",
  border: "#e5e7eb",
  text: "#111827",
  textMuted: "#6b7280",
  success: "#16a34a",
  error: "#dc2626",
  warning: "#d97706",
  info: "#2563eb",
};

export default function SettingsPage() {
  const [auth, setAuth] = useState<AuthSettings>({
    provider: "credentials",
    clerkPublishableKey: "",
    clerkSecretKey: "",
  });
  const [payment, setPayment] = useState<PaymentSettings>({
    provider: "stripe",
    mode: "test",
    stripeTestPublicKey: "",
    stripeTestSecretKey: "",
    stripeLivePublicKey: "",
    stripeLiveSecretKey: "",
  });
  const [loading, setLoading] = useState(true);
  const [savingAuth, setSavingAuth] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [savingSite, setSavingSite] = useState(false);
  const [savingTheme, setSavingTheme] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [siteMessage, setSiteMessage] = useState("");
  const [themeMessage, setThemeMessage] = useState("");
  const [siteTitle, setSiteTitle] = useState("");
  const [siteTagline, setSiteTagline] = useState("");
  const [siteFavicon, setSiteFavicon] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [siteLogoDark, setSiteLogoDark] = useState("");
  const [theme, setTheme] = useState<ThemeTokens>({ ...DEFAULT_THEME });

  useEffect(() => {
    adminSettingService
      .getAll()
      .then((res) => {
        if (res.ok && res.data) {
          const map = new Map(
            res.data.items.map((s) => [s.key, s.value as string]),
          );
          setAuth({
            provider:
              (map.get("auth.provider") as AuthProvider) || "credentials",
            clerkPublishableKey:
              (map.get("auth.clerkPublishableKey") as string) || "",
            clerkSecretKey: (map.get("auth.clerkSecretKey") as string) || "",
          });
          setPayment({
            provider: (map.get("payment.provider") as string) || "stripe",
            mode: (map.get("payment.mode") as PaymentMode) || "test",
            stripeTestPublicKey:
              (map.get("payment.stripe.testPublicKey") as string) || "",
            stripeTestSecretKey:
              (map.get("payment.stripe.testSecretKey") as string) || "",
            stripeLivePublicKey:
              (map.get("payment.stripe.livePublicKey") as string) || "",
            stripeLiveSecretKey:
              (map.get("payment.stripe.liveSecretKey") as string) || "",
          });
          setSiteTitle((map.get("site.title") as string) || "");
          setSiteTagline((map.get("site.tagline") as string) || "");
          setSiteFavicon((map.get("site.favicon") as string) || "");
          setSiteLogo((map.get("site.logo") as string) || "");
          setSiteLogoDark((map.get("site.logoDark") as string) || "");
          const loadedTheme: ThemeTokens = { ...DEFAULT_THEME };
          for (const { key } of THEME_FIELDS) {
            const val = map.get(`theme.${key}`) as string;
            if (val) loadedTheme[key] = val;
          }
          setTheme(loadedTheme);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingAuth(true);
    setAuthMessage("");

    try {
      await adminSettingService.update("auth.provider", auth.provider);
      await adminSettingService.update(
        "auth.clerkPublishableKey",
        auth.clerkPublishableKey,
      );
      await adminSettingService.update(
        "auth.clerkSecretKey",
        auth.clerkSecretKey,
      );
      setAuthMessage("Auth settings saved successfully.");
    } catch (err) {
      setAuthMessage(
        err instanceof Error ? err.message : "Failed to save settings.",
      );
    } finally {
      setSavingAuth(false);
    }
  }

  async function handlePaymentSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingPayment(true);
    setPaymentMessage("");

    try {
      await adminSettingService.update("payment.provider", payment.provider);
      await adminSettingService.update("payment.mode", payment.mode);
      await adminSettingService.update(
        "payment.stripe.testPublicKey",
        payment.stripeTestPublicKey,
      );
      await adminSettingService.update(
        "payment.stripe.testSecretKey",
        payment.stripeTestSecretKey,
      );
      await adminSettingService.update(
        "payment.stripe.livePublicKey",
        payment.stripeLivePublicKey,
      );
      await adminSettingService.update(
        "payment.stripe.liveSecretKey",
        payment.stripeLiveSecretKey,
      );
      setPaymentMessage("Payment settings saved successfully.");
    } catch (err) {
      setPaymentMessage(
        err instanceof Error ? err.message : "Failed to save settings.",
      );
    } finally {
      setSavingPayment(false);
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

  if (loading) {
    return <p className="text-sm text-muted">Loading settings&hellip;</p>;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Configure site identity, theme, authentication, and payment."
      />

      {/* Auth Settings */}
      <section className="rounded-xl border border-border bg-background p-6">
        <form onSubmit={handleAuthSubmit} className="max-w-lg space-y-5">
          <h2 className="text-base font-semibold text-foreground">
            Authentication
          </h2>

          {authMessage && (
            <Notice
              message={authMessage}
              variant={authMessage.includes("success") ? "success" : "error"}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-foreground">
              Authentication Provider
            </label>
            <select
              value={auth.provider}
              onChange={(e) =>
                setAuth((s) => ({
                  ...s,
                  provider: e.target.value as AuthProvider,
                }))
              }
              className={inputClass}
            >
              <option value="credentials">
                Credentials (email &amp; password)
              </option>
              <option value="clerk">Clerk</option>
            </select>
            <p className="mt-1 text-xs text-muted">
              Switching to Clerk will disable email/password login for users.
              Admin authentication is always password-based.
            </p>
          </div>

          {auth.provider === "clerk" && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground">
                  Clerk Publishable Key
                </label>
                <input
                  type="text"
                  value={auth.clerkPublishableKey}
                  onChange={(e) =>
                    setAuth((s) => ({
                      ...s,
                      clerkPublishableKey: e.target.value,
                    }))
                  }
                  placeholder="pk_test_..."
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground">
                  Clerk Secret Key
                </label>
                <input
                  type="password"
                  value={auth.clerkSecretKey}
                  onChange={(e) =>
                    setAuth((s) => ({
                      ...s,
                      clerkSecretKey: e.target.value,
                    }))
                  }
                  placeholder="sk_test_..."
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-muted">
                  Stored securely. Required for backend token verification.
                </p>
              </div>
            </>
          )}

          <Button type="submit" disabled={savingAuth}>
            {savingAuth ? "Saving\u2026" : "Save Auth Settings"}
          </Button>
        </form>
      </section>

      {/* Payment Settings */}
      <section className="rounded-xl border border-border bg-background p-6">
        <form onSubmit={handlePaymentSubmit} className="max-w-lg space-y-5">
          <h2 className="text-base font-semibold text-foreground">Payment</h2>

          {paymentMessage && (
            <Notice
              message={paymentMessage}
              variant={paymentMessage.includes("success") ? "success" : "error"}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-foreground">
              Payment Provider
            </label>
            <select
              value={payment.provider}
              onChange={(e) =>
                setPayment((s) => ({ ...s, provider: e.target.value }))
              }
              className={inputClass}
            >
              <option value="stripe">Stripe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Mode
            </label>
            <select
              value={payment.mode}
              onChange={(e) =>
                setPayment((s) => ({
                  ...s,
                  mode: e.target.value as PaymentMode,
                }))
              }
              className={inputClass}
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
            <p className="mt-1 text-xs text-muted">
              Test mode uses Stripe test keys. Switch to Live for real payments.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Test Mode Keys
            </h3>
            <div>
              <label className="block text-xs font-medium text-muted">
                Publishable Key
              </label>
              <input
                type="text"
                value={payment.stripeTestPublicKey}
                onChange={(e) =>
                  setPayment((s) => ({
                    ...s,
                    stripeTestPublicKey: e.target.value,
                  }))
                }
                placeholder="pk_test_..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Secret Key
              </label>
              <input
                type="password"
                value={payment.stripeTestSecretKey}
                onChange={(e) =>
                  setPayment((s) => ({
                    ...s,
                    stripeTestSecretKey: e.target.value,
                  }))
                }
                placeholder="sk_test_..."
                className={inputClass}
              />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface p-4 space-y-4">
            <h3 className="text-sm font-medium text-foreground">
              Live Mode Keys
            </h3>
            <div>
              <label className="block text-xs font-medium text-muted">
                Publishable Key
              </label>
              <input
                type="text"
                value={payment.stripeLivePublicKey}
                onChange={(e) =>
                  setPayment((s) => ({
                    ...s,
                    stripeLivePublicKey: e.target.value,
                  }))
                }
                placeholder="pk_live_..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted">
                Secret Key
              </label>
              <input
                type="password"
                value={payment.stripeLiveSecretKey}
                onChange={(e) =>
                  setPayment((s) => ({
                    ...s,
                    stripeLiveSecretKey: e.target.value,
                  }))
                }
                placeholder="sk_live_..."
                className={inputClass}
              />
            </div>
          </div>

          <Button type="submit" disabled={savingPayment}>
            {savingPayment ? "Saving\u2026" : "Save Payment Settings"}
          </Button>
        </form>
      </section>

      {/* Site Identity */}
      <section className="rounded-xl border border-border bg-background p-6">
        <form
          onSubmit={async (e: FormEvent) => {
            e.preventDefault();
            setSavingSite(true);
            setSiteMessage("");
            try {
              await adminSettingService.update("site.title", siteTitle);
              await adminSettingService.update("site.tagline", siteTagline);
              await adminSettingService.update("site.favicon", siteFavicon);
              await adminSettingService.update("site.logo", siteLogo);
              await adminSettingService.update("site.logoDark", siteLogoDark);
              setSiteMessage("Site settings saved successfully.");
            } catch (err) {
              setSiteMessage(
                err instanceof Error ? err.message : "Failed to save.",
              );
            } finally {
              setSavingSite(false);
            }
          }}
          className="max-w-lg space-y-5"
        >
          <h2 className="text-base font-semibold text-foreground">
            Site Identity
          </h2>

          {siteMessage && (
            <Notice
              message={siteMessage}
              variant={siteMessage.includes("success") ? "success" : "error"}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-foreground">
              Site Title
            </label>
            <input
              type="text"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              placeholder="My Awesome Site"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Tagline
            </label>
            <input
              type="text"
              value={siteTagline}
              onChange={(e) => setSiteTagline(e.target.value)}
              placeholder="A brief description of your site"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Favicon
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setSiteFavicon(reader.result as string);
                reader.readAsDataURL(file);
              }}
              className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
            />
            {siteFavicon && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={siteFavicon}
                  alt="Favicon preview"
                  className="h-6 w-6 rounded"
                />
                <button
                  type="button"
                  onClick={() => setSiteFavicon("")}
                  className="text-xs text-error"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Logo
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setSiteLogo(reader.result as string);
                reader.readAsDataURL(file);
              }}
              className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
            />
            {siteLogo && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={siteLogo}
                  alt="Logo preview"
                  className="h-8 rounded"
                />
                <button
                  type="button"
                  onClick={() => setSiteLogo("")}
                  className="text-xs text-error"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground">
              Logo (Dark variant)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => setSiteLogoDark(reader.result as string);
                reader.readAsDataURL(file);
              }}
              className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground"
            />
            {siteLogoDark && (
              <div className="mt-2 flex items-center gap-2">
                <img
                  src={siteLogoDark}
                  alt="Dark logo preview"
                  className="h-8 rounded"
                />
                <button
                  type="button"
                  onClick={() => setSiteLogoDark("")}
                  className="text-xs text-error"
                >
                  Remove
                </button>
              </div>
            )}
            <p className="mt-1 text-xs text-muted">
              Optional. Used when a dark background is active.
            </p>
          </div>

          <Button type="submit" disabled={savingSite}>
            {savingSite ? "Saving\u2026" : "Save Site Settings"}
          </Button>
        </form>
      </section>

      {/* Theme Colors */}
      <section className="rounded-xl border border-border bg-background p-6">
        <form
          onSubmit={async (e: FormEvent) => {
            e.preventDefault();
            setSavingTheme(true);
            setThemeMessage("");
            try {
              for (const { key } of THEME_FIELDS) {
                await adminSettingService.update(
                  `theme.${key}`,
                  theme[key] ?? "",
                );
              }
              setThemeMessage(
                "Theme saved successfully. Reload to see changes.",
              );
            } catch (err) {
              setThemeMessage(
                err instanceof Error ? err.message : "Failed to save.",
              );
            } finally {
              setSavingTheme(false);
            }
          }}
          className="max-w-lg space-y-5"
        >
          <h2 className="text-base font-semibold text-foreground">
            Theme Colors
          </h2>
          <p className="text-xs text-muted">
            Customize the application color palette. Changes apply after page
            reload.
          </p>

          {themeMessage && (
            <Notice
              message={themeMessage}
              variant={themeMessage.includes("success") ? "success" : "error"}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            {THEME_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={theme[key] || "#000000"}
                  onChange={(e) =>
                    setTheme((t) => ({ ...t, [key]: e.target.value }))
                  }
                  className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted">{theme[key]}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={savingTheme}>
              {savingTheme ? "Saving\u2026" : "Save Theme"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setTheme({ ...DEFAULT_THEME })}
            >
              Reset to Defaults
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
