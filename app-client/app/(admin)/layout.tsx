"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { useAdminAuth } from "@/hooks/use-auth";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { admin, error, isLoading } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && (error || !admin)) {
      router.replace("/login");
    }
  }, [isLoading, error, admin, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-muted">Loading&hellip;</p>
      </div>
    );
  }

  if (!admin) return null;

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
