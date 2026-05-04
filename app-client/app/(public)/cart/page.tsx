"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { checkoutService } from "@/services/checkout-service";
import { userAuthService } from "@/services/user-auth-service";
import { Button, Notice } from "@/components/ui";

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
          <h1 className="text-2xl font-bold text-foreground">Your Cart</h1>
          <p className="mt-2 text-sm text-muted">Your cart is empty.</p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground">Your Cart</h1>

      <ul className="mt-6 divide-y divide-border">
        {items.map((item) => (
          <li key={item.product.id} className="flex items-center gap-4 py-4">
            <div className="flex-1">
              <p className="font-medium text-foreground">{item.product.name}</p>
              <p className="text-sm text-muted">
                {formatPrice(item.product.price, item.product.currency)}
                {item.product.paymentModel === "recurring" && "/mo"}
              </p>
            </div>
            {item.product.paymentModel !== "recurring" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity - 1)
                  }
                  className="rounded border border-border px-2 py-0.5 text-sm hover:bg-surface"
                >
                  -
                </button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <button
                  onClick={() =>
                    updateQuantity(item.product.id, item.quantity + 1)
                  }
                  className="rounded border border-border px-2 py-0.5 text-sm hover:bg-surface"
                >
                  +
                </button>
              </div>
            )}
            <p className="w-24 text-right font-medium text-foreground">
              {formatPrice(
                item.product.price * item.quantity,
                item.product.currency,
              )}
            </p>
            <button
              onClick={() => removeItem(item.product.id)}
              className="text-sm text-error hover:text-error"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <span className="text-lg font-semibold text-foreground">Total</span>
        <span className="text-xl font-bold text-foreground">
          {formatPrice(total, "USD")}
        </span>
      </div>

      {/* Login required notice for subscriptions */}
      {!isLoggedIn &&
        items.some((item) => item.product.paymentModel === "recurring") && (
          <div className="mt-6 rounded-lg border border-warning/20 bg-warning/10 px-4 py-3 text-sm text-warning">
            Your cart contains a subscription. Please{" "}
            <Link href="/user-login" className="font-medium underline">
              log in
            </Link>{" "}
            or{" "}
            <Link href="/user-register" className="font-medium underline">
              create an account
            </Link>{" "}
            before proceeding.
          </div>
        )}

      {/* Guest one-time info */}
      {!isLoggedIn &&
        !items.some((item) => item.product.paymentModel === "recurring") && (
          <p className="mt-6 text-sm text-muted">
            Checking out as a guest — email and billing details will be
            collected by Stripe. Already have an account?{" "}
            <Link href="/user-login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>
        )}

      {error && (
        <div className="mt-4">
          <Notice message={error} variant="error" />
        </div>
      )}

      <div className="mt-6 flex gap-3">
        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="flex-1 py-3"
        >
          {loading ? "Redirecting\u2026" : "Proceed to Checkout"}
        </Button>
        <Button variant="secondary" onClick={clearCart} className="py-3">
          Clear Cart
        </Button>
      </div>

      <div className="mt-4 text-center">
        <Link href="/" className="text-sm text-muted hover:text-foreground">
          &larr; Continue Shopping
        </Link>
      </div>
    </div>
  );
}
