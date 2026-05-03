"use client";

import { useState, useEffect, type FormEvent } from "react";
import { adminSettingService } from "@/services/admin-setting-service";
import type { AuthProvider } from "@/types";

type AuthSettings = {
  provider: AuthProvider;
  clerkPublishableKey: string;
  clerkSecretKey: string;
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AuthSettings>({
    provider: "credentials",
    clerkPublishableKey: "",
    clerkSecretKey: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    adminSettingService
      .getAll()
      .then((res) => {
        if (res.ok && res.data) {
          const map = new Map(
            res.data.items.map((s) => [s.key, s.value as string]),
          );
          setSettings({
            provider:
              (map.get("auth.provider") as AuthProvider) || "credentials",
            clerkPublishableKey:
              (map.get("auth.clerkPublishableKey") as string) || "",
            clerkSecretKey: (map.get("auth.clerkSecretKey") as string) || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      await adminSettingService.update("auth.provider", settings.provider);
      await adminSettingService.update(
        "auth.clerkPublishableKey",
        settings.clerkPublishableKey,
      );
      await adminSettingService.update(
        "auth.clerkSecretKey",
        settings.clerkSecretKey,
      );
      setMessage("Settings saved successfully.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Failed to save settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Loading settings&hellip;</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure authentication provider and other system settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.includes("success")
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Authentication Provider
          </label>
          <select
            value={settings.provider}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                provider: e.target.value as AuthProvider,
              }))
            }
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="credentials">
              Credentials (email &amp; password)
            </option>
            <option value="clerk">Clerk</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Switching to Clerk will disable email/password login for users.
            Admin authentication is always password-based.
          </p>
        </div>

        {settings.provider === "clerk" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Clerk Publishable Key
              </label>
              <input
                type="text"
                value={settings.clerkPublishableKey}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    clerkPublishableKey: e.target.value,
                  }))
                }
                placeholder="pk_test_..."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Clerk Secret Key
              </label>
              <input
                type="password"
                value={settings.clerkSecretKey}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    clerkSecretKey: e.target.value,
                  }))
                }
                placeholder="sk_test_..."
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Stored securely. Required for backend token verification.
              </p>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {saving ? "Saving\u2026" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
