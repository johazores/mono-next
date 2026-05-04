"use client";

import { useEffect, useState, useCallback } from "react";
import { activityLogService } from "@/services/activity-log-service";
import { PageHeader, Button } from "@/components/ui";
import type { ActivityLogEntry } from "@/types";

const PAGE_SIZE = 20;

const actionLabels: Record<string, string> = {
  "admin.login": "Admin Login",
  "admin.login_failed": "Admin Login Failed",
  "admin.logout": "Admin Logout",
  "admin.create": "Admin Created",
  "admin.update": "Admin Updated",
  "admin.delete": "Admin Deleted",
  "user.login": "User Login",
  "user.login_failed": "User Login Failed",
  "user.register": "User Registered",
  "user.logout": "User Logout",
  "user.create": "User Created",
  "user.update": "User Updated",
  "user.delete": "User Deleted",
  "profile.update": "Profile Updated",
};

export default function ActivityPage() {
  const [items, setItems] = useState<ActivityLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(page),
      limit: String(PAGE_SIZE),
    };
    if (actionFilter) params.action = actionFilter;
    if (actorFilter) params.actor = actorFilter;

    try {
      const res = await activityLogService.list(params);
      if (res.ok && res.data) {
        setItems(res.data.items);
        setTotal(res.data.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, actorFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity Log"
        description="Track actions performed by admins, users, and the system."
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Actions</option>
          {Object.entries(actionLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={actorFilter}
          onChange={(e) => {
            setActorFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Actors</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
          <option value="system">System</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-surface">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                Action
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                Actor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                Resource
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                IP
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-muted"
                >
                  Loading&hellip;
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-sm text-muted"
                >
                  No activity logs found.
                </td>
              </tr>
            ) : (
              items.map((entry) => (
                <tr
                  key={entry.id}
                  className="transition-colors hover:bg-surface/60"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="inline-flex rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-foreground">
                      {actionLabels[entry.action] ?? entry.action}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-foreground">
                    <span className="capitalize">{entry.actor}</span>
                    {entry.actorEmail && (
                      <span className="ml-1 text-muted">
                        ({entry.actorEmail})
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted">
                    {entry.resource ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-muted font-mono">
                    {entry.ip ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
