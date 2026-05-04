"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swr";
import { userAuthService } from "@/services/user-auth-service";
import { billingService } from "@/services/billing-service";
import {
  PageHeader,
  FormSection,
  FormField,
  Notice,
  Button,
} from "@/components/ui";
import type { AppUser, UpdateUserProfileInput, BillingStatus } from "@/types";

async function billingFetcher(): Promise<BillingStatus> {
  return billingService.getStatus();
}

export default function AccountPage() {
  const {
    data: user,
    mutate: mutateUser,
    isLoading: userLoading,
  } = useSWR<AppUser>("/api/users/auth/profile", swrFetcher);
  const {
    data: billing,
    mutate: mutateBilling,
    isLoading: billingLoading,
  } = useSWR("billing-status", billingFetcher);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Sync form fields when user data loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
    }
  }, [user]);

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
        mutateUser(res.data, false);
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
      mutateBilling();
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

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted">Loading&hellip;</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Account"
        description="Manage your profile and subscription details."
      />

      {message && (
        <Notice
          message={message.text}
          variant={message.type === "success" ? "success" : "error"}
        />
      )}

      {/* Profile */}
      <FormSection title="Profile">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <FormField
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <FormField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" disabled={saving}>
            {saving ? "Saving\u2026" : "Save Changes"}
          </Button>
        </form>
      </FormSection>

      {/* Change Password */}
      <FormSection title="Change Password">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <FormField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <FormField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button type="submit" disabled={saving}>
            {saving ? "Updating\u2026" : "Update Password"}
          </Button>
        </form>
      </FormSection>

      {/* Subscription */}
      <section className="rounded-xl border border-border bg-background p-6">
        <h2 className="text-lg font-semibold text-foreground">Subscription</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted">Current Plan</dt>
            <dd className="mt-1">
              <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {user.activePlan?.name ?? "Free"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Renews</dt>
            <dd className="mt-1 text-sm text-foreground">
              {user.activePlan?.endDate
                ? new Date(user.activePlan.endDate).toLocaleDateString()
                : "N/A"}
            </dd>
          </div>
        </dl>
      </section>

      {/* Billing */}
      <section className="rounded-xl border border-border bg-background p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Billing</h2>
            <p className="mt-1 text-sm text-muted">
              Manage your payment methods, view invoices, and update your
              subscription through Stripe.
            </p>
          </div>
          {billing?.hasStripeCustomer && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? "Syncing\u2026" : "Sync from Stripe"}
            </Button>
          )}
        </div>

        {billingLoading ? (
          <p className="mt-4 text-sm text-muted">
            Loading billing info&hellip;
          </p>
        ) : billing?.hasStripeCustomer ? (
          <div className="mt-4 space-y-6">
            {/* Subscriptions */}
            {billing.subscriptions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Subscriptions
                </h3>
                <div className="mt-2 overflow-hidden rounded-xl border border-border text-sm">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-surface">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-muted">
                          ID
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-muted">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-muted">
                          Current Period End
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-muted">
                          Auto-Renew
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {billing.subscriptions.map((sub) => (
                        <tr
                          key={sub.id}
                          className="transition-colors hover:bg-surface/60"
                        >
                          <td className="px-4 py-2 font-mono text-xs text-muted">
                            {sub.id.slice(0, 20)}&hellip;
                          </td>
                          <td className="px-4 py-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                sub.status === "active"
                                  ? "bg-success/10 text-success"
                                  : sub.status === "trialing"
                                    ? "bg-primary/10 text-primary"
                                    : sub.status === "canceled"
                                      ? "bg-error/10 text-error"
                                      : "bg-surface text-muted"
                              }`}
                            >
                              {sub.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-foreground">
                            {new Date(
                              sub.currentPeriodEnd * 1000,
                            ).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-foreground">
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
                <h3 className="text-sm font-medium text-foreground">
                  Invoices
                </h3>
                <div className="mt-2 overflow-hidden rounded-xl border border-border text-sm">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-surface">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-muted">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-muted">
                          Amount
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-muted">
                          Status
                        </th>
                        <th className="px-4 py-2 text-left font-medium text-muted">
                          Invoice
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-background">
                      {billing.invoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className="transition-colors hover:bg-surface/60"
                        >
                          <td className="px-4 py-2 text-foreground">
                            {new Date(inv.created * 1000).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-foreground font-medium">
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
                                  ? "bg-success/10 text-success"
                                  : inv.status === "open"
                                    ? "bg-warning/10 text-warning"
                                    : inv.status === "void"
                                      ? "bg-error/10 text-error"
                                      : "bg-surface text-muted"
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
                                className="text-primary hover:underline"
                              >
                                View
                              </a>
                            )}
                            {inv.pdfUrl && (
                              <>
                                {inv.hostedUrl && (
                                  <span className="mx-1 text-muted">|</span>
                                )}
                                <a
                                  href={inv.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  PDF
                                </a>
                              </>
                            )}
                            {!inv.hostedUrl && !inv.pdfUrl && (
                              <span className="text-muted">&mdash;</span>
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
                <p className="text-sm text-muted">
                  No subscriptions or invoices found on Stripe.
                </p>
              )}

            <Button onClick={handleManageBilling} disabled={portalLoading}>
              {portalLoading ? "Redirecting\u2026" : "Manage Billing"}
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">
            No billing account linked. A Stripe customer will be created when
            you make your first purchase.
          </p>
        )}
      </section>
    </div>
  );
}
