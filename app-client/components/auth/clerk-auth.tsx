"use client";

import { useEffect } from "react";
import Link from "next/link";
import { SignIn, SignUp, useAuth } from "@clerk/react";

export function ClerkSignIn({ afterSignIn }: { afterSignIn: () => void }) {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isSignedIn) afterSignIn();
  }, [isSignedIn, afterSignIn]);

  // Show a link instead of redirecting so the user can see what's happening
  if (isLoaded && isSignedIn) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-center text-sm text-green-800">
        <p>You are already signed in.</p>
        <Link
          href="/my-account"
          className="mt-2 inline-block font-medium text-green-700 underline hover:text-green-900"
        >
          Go to My Account
        </Link>
      </div>
    );
  }

  return <SignIn routing="hash" />;
}

export function ClerkSignUp({ afterSignUp }: { afterSignUp: () => void }) {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isSignedIn) afterSignUp();
  }, [isSignedIn, afterSignUp]);

  if (isLoaded && isSignedIn) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-4 text-center text-sm text-green-800">
        <p>You are already signed in.</p>
        <Link
          href="/my-account"
          className="mt-2 inline-block font-medium text-green-700 underline hover:text-green-900"
        >
          Go to My Account
        </Link>
      </div>
    );
  }

  return <SignUp routing="hash" />;
}
