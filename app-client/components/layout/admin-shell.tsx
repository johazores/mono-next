"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
};

const navigation: NavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Users", href: "/users" },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-60 shrink-0 border-r border-gray-200 bg-gray-50 lg:block">
        <div className="px-4 py-6">
          <h1 className="text-lg font-bold text-gray-900 px-3">mono-next</h1>
        </div>
        <nav className="px-4">
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
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
