"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { authService, type AuthUser } from "@/services/auth-service";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [admin, setAdmin] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    authService
      .me()
      .then((res) => {
        if (res.ok && res.data) {
          setAdmin(res.data);
        } else {
          router.replace("/login");
        }
      })
      .catch(() => router.replace("/login"))
      .finally(() => setChecked(true));
  }, [router]);

  if (!checked) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-gray-400">Loading&hellip;</p>
      </div>
    );
  }

  if (!admin) return null;

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
