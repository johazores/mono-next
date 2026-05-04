"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { purchaseService } from "@/services/purchase-service";
import { useCart } from "@/hooks/use-cart";
import { useSiteConfig } from "@/components/providers/site-config-provider";
import type { Product } from "@/types";

function formatPrice(price: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  const isRecurring = product.paymentModel === "recurring";
  return (
    <div className="flex flex-col rounded-lg border border-border bg-background p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">{product.name}</h3>
      {product.description && (
        <p className="mt-1 text-sm text-muted">{product.description}</p>
      )}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">
          {formatPrice(product.price, product.currency)}
        </span>
        {isRecurring && <span className="text-sm text-muted">/mo</span>}
      </div>
      <div className="mt-1">
        <span className="inline-block rounded bg-surface px-2 py-0.5 text-xs text-muted">
          {isRecurring ? "Subscription" : "One-time"}
        </span>
      </div>
      <button
        onClick={onAdd}
        className="mt-4 w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Add to Cart
      </button>
    </div>
  );
}

function MiniCart() {
  const { items, itemCount, total, removeItem } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-foreground">
        Cart ({itemCount})
      </h3>
      <ul className="mt-3 divide-y divide-border/50">
        {items.map((item) => (
          <li
            key={item.product.id}
            className="flex items-center justify-between py-2"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {item.product.name}
                {item.quantity > 1 && (
                  <span className="text-muted"> x{item.quantity}</span>
                )}
              </p>
              <p className="text-xs text-muted">
                {formatPrice(
                  item.product.price * item.quantity,
                  item.product.currency,
                )}
              </p>
            </div>
            <button
              onClick={() => removeItem(item.product.id)}
              className="text-xs text-error hover:text-error/80"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
        <span className="text-sm font-medium text-foreground">Total</span>
        <span className="text-lg font-bold text-foreground">
          {formatPrice(total, "USD")}
        </span>
      </div>
      <Link
        href="/cart"
        className="mt-3 block w-full rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-white hover:bg-primary-hover"
      >
        Checkout
      </Link>
    </div>
  );
}

export default function LandingContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { title, tagline } = useSiteConfig();

  useEffect(() => {
    purchaseService
      .listPublicProducts()
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const subscriptions = products.filter((p) => p.paymentModel === "recurring");
  const oneTime = products.filter((p) => p.paymentModel !== "recurring");

  return (
    <div className="mx-auto max-w-5xl space-y-10 px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {tagline && <p className="mt-2 text-sm text-muted">{tagline}</p>}
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted">
          <Link href="/admin" className="hover:text-foreground underline">
            Admin Panel
          </Link>
          <span>&middot;</span>
          <Link href="/my-account" className="hover:text-foreground underline">
            My Account
          </Link>
          <span>&middot;</span>
          <Link href="/user-login" className="hover:text-foreground underline">
            Login
          </Link>
          <span>&middot;</span>
          <Link
            href="/user-register"
            className="hover:text-foreground underline"
          >
            Register
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted">Loading products...</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {subscriptions.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  Subscription Plans
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {subscriptions.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={() => addItem(product)}
                    />
                  ))}
                </div>
              </section>
            )}
            {oneTime.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-foreground">
                  One-Time Purchases
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {oneTime.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAdd={() => addItem(product)}
                    />
                  ))}
                </div>
              </section>
            )}
            {products.length === 0 && (
              <p className="text-center text-sm text-muted">
                No products available.
              </p>
            )}
          </div>
          <div>
            <MiniCart />
          </div>
        </div>
      )}
    </div>
  );
}
