"use client";

import { useState, useEffect, type FormEvent } from "react";
import { adminSettingService } from "@/services/admin-setting-service";
import type {
  AuthProvider,
  PaymentMode,
  AuthSettings,
  PaymentSettings,
} from "@/types";

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
  const [authMessage, setAuthMessage] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");

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
    "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  if (loading) {
    return <p className="text-sm text-gray-400">Loading settings&hellip;</p>;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure authentication, payment, and other system settings.
        </p>
      </div>

      {/* Auth Settings */}
      <form onSubmit={handleAuthSubmit} className="max-w-lg space-y-5">
        <h2 className="text-base font-semibold text-gray-900">
          Authentication
        </h2>

        {authMessage && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              authMessage.includes("success")
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {authMessage}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
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
          <p className="mt-1 text-xs text-gray-500">
            Switching to Clerk will disable email/password login for users.
            Admin authentication is always password-based.
          </p>
        </div>

        {auth.provider === "clerk" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
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
              <label className="block text-sm font-medium text-gray-700">
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
              <p className="mt-1 text-xs text-gray-500">
                Stored securely. Required for backend token verification.
              </p>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={savingAuth}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {savingAuth ? "Saving\u2026" : "Save Auth Settings"}
        </button>
      </form>

      <hr className="border-gray-200" />

      {/* Payment Settings */}
      <form onSubmit={handlePaymentSubmit} className="max-w-lg space-y-5">
        <h2 className="text-base font-semibold text-gray-900">Payment</h2>

        {paymentMessage && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              paymentMessage.includes("success")
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {paymentMessage}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
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
          <label className="block text-sm font-medium text-gray-700">
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
          <p className="mt-1 text-xs text-gray-500">
            Test mode uses Stripe test keys. Switch to Live for real payments.
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Test Mode Keys</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600">
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
            <label className="block text-xs font-medium text-gray-600">
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

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
          <h3 className="text-sm font-medium text-gray-700">Live Mode Keys</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600">
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
            <label className="block text-xs font-medium text-gray-600">
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

        <button
          type="submit"
          disabled={savingPayment}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {savingPayment ? "Saving\u2026" : "Save Payment Settings"}
        </button>
      </form>
    </div>
  );
}
