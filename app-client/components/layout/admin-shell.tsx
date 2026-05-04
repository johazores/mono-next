"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { authService } from "@/services/auth-service";
import { useSiteConfig } from "@/components/providers/site-config-provider";
import type { AuthUser } from "@/types";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Package,
  ToggleRight,
  BarChart3,
  Activity,
  Settings,
  UserCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type AdminNavItem = { label: string; href: string; icon: LucideIcon };

const navigation: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Admins", href: "/admin/admins", icon: ShieldCheck },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Features", href: "/admin/features", icon: ToggleRight },
  { label: "Reports", href: "/admin/reports", icon: BarChart3 },
  { label: "Activity", href: "/admin/activity", icon: Activity },
  { label: "Settings", href: "/admin/settings", icon: Settings },
  { label: "Profile", href: "/admin/profile", icon: UserCircle },
];

export function AdminShell({
  children,
  admin,
}: {
  children: ReactNode;
  admin: AuthUser;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { title, logo } = useSiteConfig();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await authService.logout();
    router.replace("/login");
  }

  const initials = (admin.name ?? admin.email)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sidebar = (
    <>
      <div className="flex items-center gap-3 px-5 py-6">
        {logo ? (
          <img src={logo} alt={title} className="h-8" />
        ) : (
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            {title}
          </h1>
        )}
      </div>

      <p className="mb-2 px-5 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Navigation
      </p>

      <nav className="flex-1 px-3">
        <ul className="grid gap-0.5">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-primary text-white shadow-sm"
                      : "text-muted hover:bg-surface hover:text-foreground"
                  }`}
                >
                  <Icon
                    size={18}
                    className={
                      active
                        ? "text-white"
                        : "text-muted group-hover:text-foreground"
                    }
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3 px-1">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {admin.name}
            </p>
            <p className="truncate text-xs text-muted">{admin.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-full bg-surface/50">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-background lg:flex lg:flex-col">
        {sidebar}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-background shadow-xl transition-transform duration-200 lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-5 rounded-lg p-1 text-muted hover:text-foreground"
        >
          <X size={20} />
        </button>
        {sidebar}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="flex items-center border-b border-border bg-background px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-muted hover:bg-surface hover:text-foreground"
          >
            <Menu size={22} />
          </button>
          <span className="ml-3 text-sm font-semibold text-foreground">
            {title}
          </span>
        </div>
        <div className="px-6 py-8 lg:px-10">{children}</div>
      </main>
    </div>
  );
}
