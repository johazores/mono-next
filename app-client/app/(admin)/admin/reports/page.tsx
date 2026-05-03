"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/services/api-client";

type ProductBreakdown = {
  productId: string;
  productName: string;
  count: number;
  revenue: number;
};
type SubscriptionBreakdown = {
  productId: string;
  productName: string;
  count: number;
};
type AdminReport = {
  revenue: { totalRevenue: number; totalTransactions: number };
  subscriptions: {
    activeSubscriptions: number;
    totalSubscriptions: number;
    byProduct: SubscriptionBreakdown[];
  };
  purchases: {
    totalPurchases: number;
    byStatus: Record<string, number>;
    byProduct: ProductBreakdown[];
  };
  users: {
    totalUsers: number;
    activeSubscribers: number;
    newUsersLast30Days: number;
  };
};

const periods = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "1y", label: "Last year" },
];

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export default function ReportsPage() {
  const [period, setPeriod] = useState("30d");
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGet<AdminReport>(
        `/api/admins/reports?period=${period}`,
      );
      if (res.ok && res.data) setReport(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="mt-1 text-sm text-gray-600">
            Revenue, subscriptions, purchases, and user statistics.
          </p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          {periods.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading&hellip;</p>}

      {report && !loading && (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat
              label="Revenue"
              value={`$${report.revenue.totalRevenue.toFixed(2)}`}
            />
            <Stat
              label="Transactions"
              value={report.revenue.totalTransactions}
            />
            <Stat label="Total Users" value={report.users.totalUsers} />
            <Stat
              label="New Users (30d)"
              value={report.users.newUsersLast30Days}
            />
          </div>

          {/* Subscriptions */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Subscriptions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {report.subscriptions.activeSubscriptions} active of{" "}
              {report.subscriptions.totalSubscriptions} total
            </p>
            {report.subscriptions.byProduct.length > 0 && (
              <table className="mt-4 min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="py-2 text-left font-medium text-gray-500">
                      Product
                    </th>
                    <th className="py-2 text-right font-medium text-gray-500">
                      Active
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.subscriptions.byProduct.map((bp) => (
                    <tr key={bp.productId}>
                      <td className="py-2 text-gray-700">{bp.productName}</td>
                      <td className="py-2 text-right text-gray-900">
                        {bp.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Purchases by product */}
          <div className="rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Purchases by Product
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {report.purchases.totalPurchases} total purchases
            </p>
            {report.purchases.byProduct.length > 0 && (
              <table className="mt-4 min-w-full divide-y divide-gray-200 text-sm">
                <thead>
                  <tr>
                    <th className="py-2 text-left font-medium text-gray-500">
                      Product
                    </th>
                    <th className="py-2 text-right font-medium text-gray-500">
                      Sales
                    </th>
                    <th className="py-2 text-right font-medium text-gray-500">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {report.purchases.byProduct.map((bp) => (
                    <tr key={bp.productId}>
                      <td className="py-2 text-gray-700">{bp.productName}</td>
                      <td className="py-2 text-right text-gray-900">
                        {bp.count}
                      </td>
                      <td className="py-2 text-right text-gray-900">
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
