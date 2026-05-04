"use client";

import { useState } from "react";
import useSWR from "swr";
import { swrFetcher } from "@/lib/swr";
import { PageHeader, StatCard } from "@/components/ui";
import type { AdminReport, ReportPeriod } from "@/types";
import { DollarSign, ArrowLeftRight, Users, UserPlus } from "lucide-react";

const periods = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
];

export default function ReportsPage() {
  const [period, setPeriod] = useState<ReportPeriod>("30d");
  const { data: report, isLoading: loading } = useSWR<AdminReport>(
    `/api/admins/reports?period=${period}`,
    swrFetcher,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Revenue, subscriptions, purchases, and user statistics."
        action={
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
            className="rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {periods.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        }
      />

      {loading && <p className="text-sm text-muted">Loading&hellip;</p>}

      {report && !loading && (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Revenue"
              value={`$${report.revenue.totalRevenue.toFixed(2)}`}
              icon={<DollarSign size={20} />}
            />
            <StatCard
              label="Transactions"
              value={report.revenue.totalTransactions}
              icon={<ArrowLeftRight size={20} />}
            />
            <StatCard
              label="Total Users"
              value={report.users.totalUsers}
              icon={<Users size={20} />}
            />
            <StatCard
              label="New Users (30d)"
              value={report.users.newUsersLast30Days}
              icon={<UserPlus size={20} />}
            />
          </div>

          {/* Subscriptions */}
          <div className="overflow-hidden rounded-xl border border-border bg-background p-5">
            <h2 className="text-lg font-semibold text-foreground">
              Subscriptions
            </h2>
            <p className="mt-1 text-sm text-muted">
              {report.subscriptions.activeSubscriptions} active of{" "}
              {report.subscriptions.totalSubscriptions} total
            </p>
            {report.subscriptions.byProduct.length > 0 && (
              <table className="mt-4 min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr>
                    <th className="py-2 text-left font-medium text-muted">
                      Product
                    </th>
                    <th className="py-2 text-right font-medium text-muted">
                      Active
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.subscriptions.byProduct.map((bp) => (
                    <tr key={bp.productId}>
                      <td className="py-2 text-foreground">{bp.productName}</td>
                      <td className="py-2 text-right text-foreground">
                        {bp.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Purchases by product */}
          <div className="overflow-hidden rounded-xl border border-border bg-background p-5">
            <h2 className="text-lg font-semibold text-foreground">
              Purchases by Product
            </h2>
            <p className="mt-1 text-sm text-muted">
              {report.purchases.totalPurchases} total purchases
            </p>
            {report.purchases.byProduct.length > 0 && (
              <table className="mt-4 min-w-full divide-y divide-border text-sm">
                <thead>
                  <tr>
                    <th className="py-2 text-left font-medium text-muted">
                      Product
                    </th>
                    <th className="py-2 text-right font-medium text-muted">
                      Sales
                    </th>
                    <th className="py-2 text-right font-medium text-muted">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {report.purchases.byProduct.map((bp) => (
                    <tr key={bp.productId}>
                      <td className="py-2 text-foreground">{bp.productName}</td>
                      <td className="py-2 text-right text-foreground">
                        {bp.count}
                      </td>
                      <td className="py-2 text-right text-foreground">
                        ${bp.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
