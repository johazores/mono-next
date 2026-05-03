"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { userAuthService, type AppUser } from "@/services/user-auth-service";

type NavItem = {
  label: string;
  href: string;
};

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Account", href: "/account" },
];

export function UserShell({
  children,
  user,
}: {
  children: ReactNode;
  user: AppUser;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await userAuthService.logout();
    router.replace("/user-login");
  }

  const planLabel: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
    enterprise: "Enterprise",
  };

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-gray-50 lg:flex lg:flex-col">
        <div className="px-4 py-6">
          <h1 className="text-lg font-bold text-gray-900 px-3">mono-next</h1>
          <span className="mt-1 inline-block rounded-full bg-blue-100 px-3 py-0.5 text-xs font-medium text-blue-700">
            {planLabel[user.plan] ?? user.plan}
          </span>
        </div>
        <nav className="flex-1 px-4">
          <ul className="grid gap-1">
            {navigation.map((item) => {
              const active = pathname === item.href;
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
            {user.name}
          </p>
          <p className="truncate px-3 text-xs text-gray-400">{user.email}</p>
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
