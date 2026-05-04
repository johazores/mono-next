"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader, StatCard, DashboardCard } from "@/components/ui";
import { userAuthService } from "@/services/user-auth-service";
import { getMyFeatures } from "@/services/feature-service";
import { purchaseService } from "@/services/purchase-service";
import { downloadService } from "@/services/download-service";
import type { AppUser, FeatureFlag, Purchase, PurchaseDownload } from "@/types";
import {
  UserCog,
  Sparkles,
  ShoppingBag,
  Download,
  Package,
  Crown,
  ArrowRight,
} from "lucide-react";

export default function MyAccountPage() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [features, setFeatures] = useState<FeatureFlag[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [downloads, setDownloads] = useState<PurchaseDownload[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, f, p, d] = await Promise.all([
        userAuthService.getProfile(),
        getMyFeatures(),
        purchaseService.listPurchases(),
        downloadService.listDownloads(),
      ]);
      if (u.ok && u.data) setUser(u.data);
      if (f) setFeatures(f);
      if (p) setPurchases(p);
      if (d) setDownloads(d);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const planName = user?.activePlan?.name ?? "Free";
  const endDate = user?.activePlan?.endDate
    ? new Date(user.activePlan.endDate).toLocaleDateString()
    : null;
  const totalFiles = downloads.reduce((s, d) => s + d.files.length, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title={loading ? "My Account" : `Welcome back, ${user?.name ?? ""}`}
        description="Here's a snapshot of your account."
      />

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Current Plan"
            value={planName}
            detail={endDate ? `Renews ${endDate}` : undefined}
            icon={<Crown size={20} />}
          />
          <StatCard
            label="Features"
            value={features.filter((f) => f.enabled).length}
            detail={`of ${features.length} available`}
            icon={<Sparkles size={20} />}
          />
          <StatCard
            label="Purchases"
            value={purchases.length}
            detail={
              purchases.length > 0
                ? `Latest: ${purchases[0]?.product?.name ?? "—"}`
                : undefined
            }
            icon={<ShoppingBag size={20} />}
          />
          <StatCard
            label="Downloads"
            value={totalFiles}
            detail={`across ${downloads.length} products`}
            icon={<Download size={20} />}
          />
        </div>
      )}

      {/* Quick links & Recent purchases */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          <h2 className="text-sm font-semibold text-muted">Quick Links</h2>
          <div className="grid gap-2">
            <DashboardCard
              title="Account Settings"
              description="Profile & password"
              icon={<UserCog size={18} />}
              href="/account"
            />
            <DashboardCard
              title="My Features"
              description={`${features.filter((f) => f.enabled).length} active`}
              icon={<Sparkles size={18} />}
              href="/features"
            />
            <DashboardCard
              title="Downloads"
              description={`${totalFiles} files ready`}
              icon={<Download size={18} />}
              href="/downloads"
            />
            <DashboardCard
              title="Browse Products"
              description="View available products"
              icon={<Package size={18} />}
              href="/purchases"
            />
          </div>
        </div>

        {/* Recent purchases */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted">
              Recent Purchases
            </h2>
            <a
              href="/purchases"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-hover"
            >
              View all <ArrowRight size={12} />
            </a>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-background">
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-5 animate-pulse rounded bg-surface"
                  />
                ))}
              </div>
            ) : purchases.length > 0 ? (
              <ul className="divide-y divide-border">
                {purchases.slice(0, 5).map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface/50"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Package size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {p.product?.name ?? "Product"}
                      </p>
                      <p className="text-xs text-muted">
                        ${(p.amount / 100).toFixed(2)}{" "}
                        {p.currency.toUpperCase()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "active" || p.status === "completed"
                          ? "bg-success/10 text-success"
                          : "bg-warning/10 text-warning"
                      }`}
                    >
                      {p.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-muted">
                No purchases yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
