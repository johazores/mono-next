"use client";

import { useEffect } from "react";
import { SignIn, SignUp, useAuth } from "@clerk/react";

export function ClerkSignIn({ afterSignIn }: { afterSignIn: () => void }) {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) afterSignIn();
  }, [isSignedIn, afterSignIn]);

  return <SignIn routing="hash" />;
}

export function ClerkSignUp({ afterSignUp }: { afterSignUp: () => void }) {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (isSignedIn) afterSignUp();
  }, [isSignedIn, afterSignUp]);

  return <SignUp routing="hash" />;
}
