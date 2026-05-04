"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { useSiteConfig } from "@/components/providers/site-config-provider";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { title, logo } = useSiteConfig();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.login(email, password);
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-full items-center justify-center overflow-hidden bg-gradient-to-br from-[var(--theme-primary)] via-[var(--theme-primary)]/80 to-[var(--theme-accent)] px-4 py-12">
      {/* Decorative background circles */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="rounded-2xl border border-white/20 bg-white/95 px-8 py-10 shadow-2xl backdrop-blur-sm">
          <div className="mb-8 text-center">
            {logo ? (
              <img src={logo} alt={title} className="mx-auto mb-4 h-10" />
            ) : (
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--theme-primary)]/10">
                <ShieldCheck
                  size={28}
                  className="text-[var(--theme-primary)]"
                />
              </div>
            )}
            <h1 className="text-xl font-bold tracking-tight text-[var(--theme-text)]">
              Admin Portal
            </h1>
            <p className="mt-1 text-sm text-[var(--theme-muted)]">
              Sign in to manage your site
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
                placeholder="admin@example.com"
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
        </div>

        <p className="mt-6 text-center text-xs text-white/60">
          Protected area &middot; Authorized personnel only
        </p>
      </div>
    </div>
  );
}
