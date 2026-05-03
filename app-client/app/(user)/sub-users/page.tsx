"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/services/api-client";
import { userAuthService } from "@/services/user-auth-service";
import { Button, Modal, Notice } from "@/components/ui";

type SubUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  purchaseCount?: number;
  createdAt: string;
};

export default function SubUsersPage() {
  const [items, setItems] = useState<SubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubUser, setIsSubUser] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    try {
      const me = await userAuthService.me();
      if (me.ok && me.data?.parentId) {
        setIsSubUser(true);
        setLoading(false);
        return;
      }
      const res = await apiGet<{ items: SubUser[] }>(
        "/api/users/auth/sub-users",
      );
      if (res.ok && res.data) setItems(res.data.items);
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
    try {
      await apiPost("/api/users/auth/sub-users", { name, email, password });
      setName("");
      setEmail("");
      setPassword("");
      setShowCreate(false);
      setMessage({ type: "success", text: "Sub-user created." });
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

  async function handleDelete(user: SubUser) {
    const hasPurchases = (user.purchaseCount ?? 0) > 0;
    const action = hasPurchases ? "block" : "delete";
    const confirmMsg = hasPurchases
      ? `This sub-user has ${user.purchaseCount} purchase(s). They will be blocked instead of deleted to preserve their purchase records. Continue?`
      : "Delete this sub-user?";

    if (!confirm(confirmMsg)) return;
    try {
      await apiDelete(`/api/users/auth/sub-users/${user.id}`);
      setMessage({
        type: "success",
        text:
          action === "block"
            ? "Sub-user has been blocked. Their purchase records are preserved."
            : "Sub-user deleted.",
      });
      load();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : `Failed to ${action}.`,
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
        {!isSubUser && (
          <Button onClick={() => setShowCreate(true)}>Create Sub-User</Button>
        )}
      </div>

      {message && <Notice message={message.text} variant={message.type} />}

      {isSubUser && (
        <Notice
          message="Sub-users cannot manage their own sub-users. This feature is only available to account owners."
          variant="info"
        />
      )}

      {loading && <p className="text-sm text-gray-400">Loading&hellip;</p>}
      {error && <Notice message={error} variant="error" />}

      {!loading && items.length === 0 && (
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
                      onClick={() => handleDelete(u)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      {(u.purchaseCount ?? 0) > 0 ? "Block" : "Delete"}
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
          title="Create Sub-User"
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
                {saving ? "Creating…" : "Create"}
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
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">
                Min 8 chars, uppercase, lowercase, digit.
              </p>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
