"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/swr";
import { PageHeader, StatCard, DashboardCard } from "@/components/ui";
import type { AdminReport, ActivityLogList } from "@/types";
import {
  DollarSign,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  Package,
  ToggleRight,
  BarChart3,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { data: report, isLoading: reportLoading } = useSWR<AdminReport>(
    "/api/admins/reports?period=30d",
    swrFetcher,
  );
  const { data: activity, isLoading: activityLoading } =
    useSWR<ActivityLogList>("/api/activity-logs?limit=5", swrFetcher);

  const loading = reportLoading || activityLoading;
  const recentActivity = activity?.items ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your platform in the last 30 days."
      />

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : report ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Revenue"
            value={`$${report.revenue.totalRevenue.toFixed(2)}`}
            detail={`${report.revenue.totalTransactions} transactions`}
            icon={<DollarSign size={20} />}
          />
          <StatCard
            label="Active Subscriptions"
            value={report.subscriptions.activeSubscriptions}
            detail={`of ${report.subscriptions.totalSubscriptions} total`}
            icon={<CreditCard size={20} />}
          />
          <StatCard
            label="Total Users"
            value={report.users.totalUsers}
            detail={`${report.users.activeSubscribers} subscribers`}
            icon={<Users size={20} />}
          />
          <StatCard
            label="New Users"
            value={report.users.newUsersLast30Days}
            detail="last 30 days"
            icon={<TrendingUp size={20} />}
          />
        </div>
      ) : null}

      {/* Quick links & Recent activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick links */}
        <div className="space-y-3 lg:col-span-1">
          <h2 className="text-sm font-semibold text-muted">Quick Actions</h2>
          <div className="grid gap-2">
            <DashboardCard
              title="Products"
              description="Manage your catalog"
              icon={<Package size={18} />}
              href="/admin/products"
            />
            <DashboardCard
              title="Features"
              description="Toggle feature flags"
              icon={<ToggleRight size={18} />}
              href="/admin/features"
            />
            <DashboardCard
              title="Reports"
              description="Revenue & analytics"
              icon={<BarChart3 size={18} />}
              href="/admin/reports"
            />
            <DashboardCard
              title="Settings"
              description="Auth, payments & theme"
              icon={<Settings size={18} />}
              href="/admin/settings"
            />
          </div>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted">
              Recent Activity
            </h2>
            <a
              href="/admin/activity"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
            >
              View all <ArrowRight size={12} />
            </a>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-5 animate-pulse rounded bg-surface"
                  />
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <ul className="divide-y divide-border">
                {recentActivity.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface/50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-xs font-medium text-muted">
                      {(entry.actorEmail ?? "?")[0].toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-foreground">
                        <span className="font-medium">
                          {entry.actorEmail ?? "System"}
                        </span>{" "}
                        <span className="text-muted">{entry.action}</span>{" "}
                        {entry.resource && (
                          <span className="text-muted">
                            on {entry.resource}
                          </span>
                        )}
                      </p>
                    </div>
                    <time className="shrink-0 text-xs text-muted">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
