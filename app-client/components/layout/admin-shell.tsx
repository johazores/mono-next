"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { authService, type AuthUser } from "@/services/auth-service";

type NavItem = {
  label: string;
  href: string;
};

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin/users" },
  { label: "Admins", href: "/admin/admins" },
  { label: "Plans", href: "/admin/plans" },
  { label: "Activity", href: "/admin/activity" },
  { label: "Profile", href: "/admin/profile" },
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

  async function handleLogout() {
    await authService.logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-gray-50 lg:flex lg:flex-col">
        <div className="px-4 py-6">
          <h1 className="text-lg font-bold text-gray-900 px-3">mono-next</h1>
        </div>
        <nav className="flex-1 px-4">
          <ul className="grid gap-1">
            {navigation.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-gray-200 px-4 py-4">
          <p className="truncate px-3 text-sm font-medium text-gray-700">
            {admin.name}
          </p>
          <p className="truncate px-3 text-xs text-gray-400">{admin.email}</p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
