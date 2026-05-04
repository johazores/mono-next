"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { userAuthService } from "@/services/user-auth-service";
import { useAuthConfig } from "@/components/auth/auth-config-provider";
import { useSiteConfig } from "@/components/providers/site-config-provider";
import { ClerkSignIn } from "@/components/auth/clerk-auth";
import { Notice } from "@/components/ui";
import { LogIn } from "lucide-react";

export default function UserLoginPage() {
  const router = useRouter();
  const { provider, clerkPublishableKey, ready } = useAuthConfig();
  const { title, logo } = useSiteConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClerkSignIn = useCallback(() => {
    router.push("/my-account");
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await userAuthService.login(email, password);
      router.push("/my-account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--theme-surface)]">
        <p className="text-sm text-[var(--theme-muted)]">Loading&hellip;</p>
      </div>
    );
  }

  if (provider === "clerk") {
    if (!clerkPublishableKey) {
      return (
        <div className="flex min-h-full items-center justify-center bg-[var(--theme-surface)] px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] p-8 shadow-lg">
            <div className="text-center">
              <h1 className="text-xl font-bold text-[var(--theme-text)]">
                {title}
              </h1>
              <p className="mt-1 text-sm text-[var(--theme-muted)]">
                Sign in to your account
              </p>
            </div>
            <div className="mt-6">
              <Notice
                message="SSO (Clerk) authentication is enabled but the Clerk Publishable Key has not been configured. Please ask an administrator to set it in the admin settings panel."
                variant="warning"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--theme-surface)] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] p-8 shadow-lg">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-[var(--theme-text)]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-[var(--theme-muted)]">
              Sign in to your account
            </p>
          </div>
          <ClerkSignIn afterSignIn={handleClerkSignIn} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-[var(--theme-surface)] px-4 py-12">
      {/* Subtle gradient accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[var(--theme-primary)]/5 to-transparent" />

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-8 py-10 shadow-lg">
          <div className="mb-8 text-center">
            {logo ? (
              <img src={logo} alt={title} className="mx-auto mb-4 h-10" />
            ) : (
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--theme-primary)]/10">
                <LogIn size={26} className="text-[var(--theme-primary)]" />
              </div>
            )}
            <h1 className="text-xl font-bold tracking-tight text-[var(--theme-text)]">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-[var(--theme-muted)]">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-[var(--theme-error)]/10 px-4 py-2.5 text-sm text-[var(--theme-error)]">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[var(--theme-text)]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2.5 text-sm text-[var(--theme-text)] outline-none transition-shadow placeholder:text-[var(--theme-muted)] focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/20"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[var(--theme-text)]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-2.5 text-sm text-[var(--theme-text)] outline-none transition-shadow placeholder:text-[var(--theme-muted)] focus:border-[var(--theme-primary)] focus:ring-2 focus:ring-[var(--theme-primary)]/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--theme-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--theme-primary)]/50 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Signing in\u2026" : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--theme-muted)]">
              Don&apos;t have an account?{" "}
              <Link
                href="/user-register"
                className="font-medium text-[var(--theme-primary)] hover:underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
