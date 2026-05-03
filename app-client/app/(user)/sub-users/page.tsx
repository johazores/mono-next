"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyFeatures } from "@/services/feature-service";
import { subUserService } from "@/services/sub-user-service";
import type { SubUser, CreateSubUserResult } from "@/types";
import { Button, Modal, Notice } from "@/components/ui";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sub-Users</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage users under your account. They inherit your features.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreate(true)}>Add Sub-User</Button>
        )}
      </div>

      {message && <Notice message={message.text} variant={message.type} />}

      {createResult?.generatedPassword && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">
            Generated password for {createResult.user.email}:
          </p>
          <code className="mt-1 block rounded bg-white px-3 py-2 font-mono text-sm text-gray-900 select-all">
            {createResult.generatedPassword}
          </code>
          <p className="mt-2 text-xs text-amber-600">
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

      {loading && <p className="text-sm text-gray-400">Loading&hellip;</p>}
      {error && <Notice message={error} variant="error" />}

      {!loading && canCreate && items.length === 0 && (
        <p className="text-sm text-gray-500">No sub-users yet.</p>
      )}

      {items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRevoke(u)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Revoke
                    </button>
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
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">
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
