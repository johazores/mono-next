"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { userAuthService } from "@/services/user-auth-service";
import { useAuthConfig } from "@/components/auth/auth-config-provider";
import { useSiteConfig } from "@/components/providers/site-config-provider";
import { ClerkSignUp } from "@/components/auth/clerk-auth";
import { Notice, FormField, Button } from "@/components/ui";

export default function UserRegisterPage() {
  const router = useRouter();
  const { provider, clerkPublishableKey, ready } = useAuthConfig();
  const { title } = useSiteConfig();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClerkSignUp = useCallback(() => {
    router.push("/my-account");
  }, [router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await userAuthService.register(name, email, password);
      router.push("/my-account");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
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
              <p className="mt-1 text-sm text-muted">Create your account</p>
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
            <p className="mt-1 text-sm text-muted">Create your account</p>
          </div>
          <ClerkSignUp afterSignUp={handleClerkSignUp} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Notice message={error} variant="error" />}

          <FormField
            id="name"
            label="Name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating account\u2026" : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/user-login"
            className="font-medium text-primary hover:text-primary"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
