"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserShell } from "@/components/layout/user-shell";
import { useUserAuth } from "@/hooks/use-auth";
import { useAuthConfig } from "@/components/auth/auth-config-provider";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { ready } = useAuthConfig();
  const { user, error, isLoading } = useUserAuth(ready);

  useEffect(() => {
    if (ready && !isLoading && (error || !user)) {
      router.replace("/user-login");
    }
  }, [ready, isLoading, error, user, router]);

  if (!ready || isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-muted">Loading&hellip;</p>
      </div>
    );
  }

  if (!user) return null;

  return <UserShell user={user}>{children}</UserShell>;
}
