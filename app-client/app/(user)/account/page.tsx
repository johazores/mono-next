"use client";

import { useEffect, useState } from "react";
import { userAuthService } from "@/services/user-auth-service";
import { billingService, type BillingStatus } from "@/services/billing-service";
import type { AppUser, UpdateUserProfileInput } from "@/types";

export default function AccountPage() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    userAuthService.getProfile().then((res) => {
      if (res.ok && res.data) {
        setUser(res.data);
        setName(res.data.name);
        setEmail(res.data.email);
      }
    });
    billingService
      .getStatus()
      .then(setBilling)
      .catch(() => {})
      .finally(() => setBillingLoading(false));
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const input: UpdateUserProfileInput = {};
    if (name !== user?.name) input.name = name;
    if (email !== user?.email) input.email = email;

    if (Object.keys(input).length === 0) {
      setMessage({ type: "error", text: "No changes to save." });
      setSaving(false);
      return;
    }

    try {
      const res = await userAuthService.updateProfile(input);
      if (res.ok && res.data) {
        setUser(res.data);
        setMessage({ type: "success", text: "Profile updated." });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Update failed.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!currentPassword || !newPassword) {
      setMessage({
        type: "error",
        text: "Both current and new password are required.",
      });
      setSaving(false);
      return;
    }

    try {
      const res = await userAuthService.updateProfile({
        currentPassword,
        newPassword,
      });
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setMessage({ type: "success", text: "Password updated." });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Update failed.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true);
    try {
      const result = await billingService.createPortalSession(
        window.location.href,
      );
      window.location.href = result.url;
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to open billing.",
      });
      setPortalLoading(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    try {
      const result = await billingService.syncPurchases();
      // Refresh billing data after sync
      const updated = await billingService.getStatus();
      setBilling(updated);
      setMessage({
        type: "success",
        text: `Synced ${result.synced} record${result.synced !== 1 ? "s" : ""} from Stripe.`,
      });
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to sync.",
      });
    } finally {
      setSyncing(false);
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-400">Loading&hellip;</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your profile and subscription details.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        <form onSubmit={handleProfileSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving\u2026" : "Save Changes"}
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Updating\u2026" : "Update Password"}
          </button>
        </form>
      </section>

      {/* Subscription */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Current Plan</dt>
            <dd className="mt-1">
              <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {user.activePlan?.name ?? "Free"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Renews</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.activePlan?.endDate
                ? new Date(user.activePlan.endDate).toLocaleDateString()
                : "N/A"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Billing */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your payment methods, view invoices, and update your
              subscription through Stripe.
            </p>
          </div>
          {billing?.hasStripeCustomer && (
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {syncing ? "Syncing\u2026" : "Sync from Stripe"}
            </button>
          )}
        </div>

        {billingLoading ? (
          <p className="mt-4 text-sm text-gray-400">
            Loading billing info&hellip;
          </p>
        ) : billing?.hasStripeCustomer ? (
          <div className="mt-4 space-y-6">
            {/* Subscriptions */}
            {billing.subscriptions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  Subscriptions
                </h3>
                <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 text-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          ID
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Current Period End
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Auto-Renew
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {billing.subscriptions.map((sub) => (
                        <tr key={sub.id}>
                          <td className="px-4 py-2 font-mono text-xs text-gray-500">
                            {sub.id.slice(0, 20)}&hellip;
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                sub.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : sub.status === "trialing"
                                    ? "bg-blue-100 text-blue-700"
                                    : sub.status === "canceled"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {new Date(
                              sub.currentPeriodEnd * 1000,
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-gray-700">
                            {sub.cancelAtPeriodEnd
                              ? "No (cancels at end)"
                              : "Yes"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Invoices */}
            {billing.invoices && billing.invoices.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700">Invoices</h3>
                <div className="mt-2 overflow-hidden rounded-lg border border-gray-200 text-sm">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                          Invoice
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {billing.invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="px-4 py-2 text-gray-700">
                            {new Date(inv.created * 1000).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-gray-900 font-medium">
                            {inv.currency}{" "}
                            {inv.amountPaid.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                inv.status === "paid"
                                  ? "bg-green-100 text-green-700"
                                  : inv.status === "open"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : inv.status === "void"
                                      ? "bg-red-100 text-red-600"
                                      : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {inv.hostedUrl && (
                              <a
                                href={inv.hostedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View
                              </a>
                            )}
                            {inv.pdfUrl && (
                              <>
                                {inv.hostedUrl && (
                                  <span className="mx-1 text-gray-300">|</span>
                                )}
                                <a
                                  href={inv.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  PDF
                                </a>
                              </>
                            )}
                            {!inv.hostedUrl && !inv.pdfUrl && (
                              <span className="text-gray-400">&mdash;</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {billing.subscriptions.length === 0 &&
              (!billing.invoices || billing.invoices.length === 0) && (
                <p className="text-sm text-gray-600">
                  No subscriptions or invoices found on Stripe.
                </p>
              )}

            <button
              type="button"
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {portalLoading ? "Redirecting\u2026" : "Manage Billing"}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">
            No billing account linked. A Stripe customer will be created when
            you make your first purchase.
          </p>
        )}
      </section>
    </div>
  );
}
