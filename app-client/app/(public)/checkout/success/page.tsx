"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { checkoutService } from "@/services/checkout-service";
import { useCart } from "@/hooks/use-cart";
import type { CheckoutVerifyResponse } from "@/types";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { clearCart } = useCart();

  const [result, setResult] = useState<CheckoutVerifyResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID found.");
      setLoading(false);
      return;
    }

    checkoutService
      .verify(sessionId)
      .then((data) => {
        setResult(data);
        clearCart();
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "Failed to verify payment.",
        );
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-sm text-gray-500">Verifying your payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Payment Verification Failed
          </h1>
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-blue-600 hover:underline"
          >
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-8 w-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Payment Successful
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Thank you for your purchase!
        </p>

        {result?.purchases && result.purchases.length > 0 && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4 text-left">
            <h3 className="text-sm font-medium text-gray-900">
              Your Purchases
            </h3>
            <ul className="mt-2 divide-y divide-gray-100">
              {result.purchases.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-gray-700">
                    {p.product?.name ?? "Product"}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    ${p.amount.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result?.user && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
            <h3 className="text-sm font-medium text-blue-900">
              Account Created
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              An account has been created for{" "}
              <strong>{result.user.email}</strong>. Please use the password
              reset feature to set your password.
            </p>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/account"
            className="block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to My Account
          </Link>
          <Link
            href="/"
            className="block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
