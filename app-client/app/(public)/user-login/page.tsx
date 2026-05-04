"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { userAuthService } from "@/services/user-auth-service";
import { useAuthConfig } from "@/components/auth/auth-config-provider";
import { useSiteConfig } from "@/components/providers/site-config-provider";
import { ClerkSignIn } from "@/components/auth/clerk-auth";
import { Notice, FormField, Button } from "@/components/ui";

export default function UserLoginPage() {
  const router = useRouter();
  const { provider, clerkPublishableKey, ready } = useAuthConfig();
  const { title } = useSiteConfig();
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
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-muted">Loading&hellip;</p>
      </div>
    );
  }

  if (provider === "clerk") {
    if (!clerkPublishableKey) {
      return (
        <div className="flex min-h-full items-center justify-center px-4">
          <div className="w-full max-w-sm space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              <p className="mt-1 text-sm text-muted">Sign in to your account</p>
            </div>
            <Notice
              message="SSO (Clerk) authentication is enabled but the Clerk Publishable Key has not been configured. Please ask an administrator to set it in the admin settings panel."
              variant="warning"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted">Sign in to your account</p>
          </div>
          <ClerkSignIn afterSignIn={handleClerkSignIn} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Notice message={error} variant="error" />}

          <FormField
            id="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Signing in\u2026" : "Sign in"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/user-register"
            className="font-medium text-primary hover:text-primary"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
