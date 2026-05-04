"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyFeatures } from "@/services/feature-service";
import { subUserService } from "@/services/sub-user-service";
import type { SubUser, CreateSubUserResult } from "@/types";
import {
  Button,
  Modal,
  Notice,
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/components/ui";

export default function SubUsersPage() {
  const [items, setItems] = useState<SubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [createResult, setCreateResult] = useState<CreateSubUserResult | null>(
    null,
  );

  const load = useCallback(async () => {
    try {
      setError("");
      const features = await getMyFeatures();
      const hasSubUserFeature = features.some(
        (f) => f.key === "sub-users.create" && f.enabled,
      );
      setCanCreate(hasSubUserFeature);

      const items = await subUserService.list();
      setItems(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setCreateResult(null);
    try {
      const result = await subUserService.create({ email });
      setEmail("");
      setShowCreate(false);
      setCreateResult(result);
      if (result.linked) {
        setMessage({
          type: "success",
          text: `Existing user "${result.user.email}" has been linked as a sub-user.`,
        });
      } else {
        setMessage({
          type: "success",
          text: `New sub-user "${result.user.email}" has been created.`,
        });
      }
      load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleRevoke(user: SubUser) {
    if (
      !confirm(
        "Revoke this sub-user? They will lose access to your subscription's features but keep their own account and purchases.",
      )
    )
      return;
    try {
      await subUserService.revoke(user.id);
      setMessage({
        type: "success",
        text: "Sub-user revoked. Their account is now independent.",
      });
      load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to revoke.",
      });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sub-Users"
        description="Manage users under your account. They inherit your features."
        action={
          canCreate ? (
            <Button onClick={() => setShowCreate(true)}>Add Sub-User</Button>
          ) : undefined
        }
      />

      {message && <Notice message={message.text} variant={message.type} />}

      {createResult?.generatedPassword && (
        <div className="rounded-lg border border-warning/20 bg-warning/10 p-4">
          <p className="text-sm font-medium text-warning">
            Generated password for {createResult.user.email}:
          </p>
          <code className="mt-1 block rounded bg-background px-3 py-2 font-mono text-sm text-foreground select-all">
            {createResult.generatedPassword}
          </code>
          <p className="mt-2 text-xs text-warning">
            Save this password now. It will not be shown again.
          </p>
        </div>
      )}

      {!canCreate && !loading && (
        <Notice
          message="Your current plan does not include sub-user management. Upgrade to a plan with this feature."
          variant="info"
        />
      )}

      {loading && <p className="text-sm text-muted">Loading&hellip;</p>}
      {error && <Notice message={error} variant="error" />}

      {!loading && canCreate && items.length === 0 && (
        <EmptyState message="No sub-users yet." />
      )}

      {items.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((u) => (
                <tr
                  key={u.id}
                  className="transition-colors hover:bg-surface/60"
                >
                  <td className="px-4 py-3 text-sm text-foreground">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge
                      status={u.status}
                      variant={u.status === "active" ? "success" : "muted"}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRevoke(u)}
                    >
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal
          title="Add Sub-User"
          onClose={() => setShowCreate(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button
                onClick={() =>
                  document
                    .getElementById("create-sub-user-form")
                    ?.dispatchEvent(
                      new Event("submit", { cancelable: true, bubbles: true }),
                    )
                }
                disabled={saving}
              >
                {saving ? "Adding…" : "Add"}
              </Button>
            </div>
          }
        >
          <form
            id="create-sub-user-form"
            onSubmit={handleCreate}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-foreground">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-muted">
                If this email already exists, the user will be linked instead of
                created.
              </p>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
