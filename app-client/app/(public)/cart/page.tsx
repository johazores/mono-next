"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { checkoutService } from "@/services/checkout-service";
import { userAuthService } from "@/services/user-auth-service";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

export default function CartPage() {
  const { items, total, removeItem, updateQuantity, clearCart, itemCount } =
    useCart();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    userAuthService
      .me()
      .then((res) => setIsLoggedIn(res.ok))
      .catch(() => setIsLoggedIn(false));
  }, []);

  async function handleCheckout() {
    setError("");

    // For recurring subscriptions, require login
    const hasRecurring = items.some(
      (item) => item.product.paymentModel === "recurring",
    );
    if (hasRecurring && !isLoggedIn) {
      setError(
        "You must be logged in to purchase a subscription. Please log in or create an account first.",
      );
      return;
    }

    setLoading(true);
    try {
      const origin = window.location.origin;
      const result = await checkoutService.createSession({
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        successUrl: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/checkout/cancel`,
      });

      // Redirect to Stripe Checkout
      window.location.href = result.redirectUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
      setLoading(false);
    }
  }

  if (itemCount === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          <p className="mt-2 text-sm text-gray-500">Your cart is empty.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>

      <ul className="mt-6 divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.product.id} className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.product.name}</p>
              <p className="text-sm text-gray-500">
                {formatPrice(item.product.price, item.product.currency)}
                {item.product.paymentModel === "recurring" &&
                  item.product.interval &&
                  `/${item.product.interval}`}
              </p>
            </div>
            {item.product.paymentModel !== "recurring" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity - 1)
                  }
                  className="rounded border border-gray-300 px-2 py-0.5 text-sm hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity + 1)
                  }
                  className="rounded border border-gray-300 px-2 py-0.5 text-sm hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            )}
            <p className="w-24 text-right font-medium text-gray-900">
              {formatPrice(
                item.product.price * item.quantity,
                item.product.currency,
              )}
            </p>
            <button
              onClick={() => removeItem(item.product.id)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
        <span className="text-lg font-semibold text-gray-900">Total</span>
        <span className="text-xl font-bold text-gray-900">
          {formatPrice(total, "USD")}
        </span>
      </div>

      {/* Login required notice for subscriptions */}
      {!isLoggedIn &&
        items.some((item) => item.product.paymentModel === "recurring") && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your cart contains a subscription. Please{" "}
            <Link
              href="/user-login"
              className="font-medium text-amber-900 underline"
            >
              log in
            </Link>{" "}
            or{" "}
            <Link
              href="/user-register"
              className="font-medium text-amber-900 underline"
            >
              create an account
            </Link>{" "}
            before proceeding.
          </div>
        )}

      {/* Guest one-time info */}
      {!isLoggedIn &&
        !items.some((item) => item.product.paymentModel === "recurring") && (
          <p className="mt-6 text-sm text-gray-500">
            Checking out as a guest — email and billing details will be
            collected by Stripe. Already have an account?{" "}
            <Link href="/user-login" className="text-blue-600 hover:underline">
              Log in
            </Link>
          </p>
        )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Redirecting..." : "Proceed to Checkout"}
        </button>
        <button
          onClick={clearCart}
          className="rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Clear Cart
        </button>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Continue Shopping
        </Link>
      </div>
    </div>
  );
}
