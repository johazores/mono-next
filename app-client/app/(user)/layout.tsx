"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserShell } from "@/components/layout/user-shell";
import { userAuthService } from "@/services/user-auth-service";
import { useAuthConfig } from "@/components/auth/auth-config-provider";
import type { AppUser } from "@/types";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const { ready } = useAuthConfig();
  const [user, setUser] = useState<AppUser | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!ready) return;

    userAuthService
      .me()
      .then((res) => {
        if (res.ok && res.data) {
          setUser(res.data);
        } else {
          router.replace("/user-login");
        }
      })
      .catch(() => router.replace("/user-login"))
      .finally(() => setChecked(true));
  }, [router, ready]);

  if (!checked) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-gray-400">Loading&hellip;</p>
      </div>
    );
  }

  if (!user) return null;

  return <UserShell user={user}>{children}</UserShell>;
}
