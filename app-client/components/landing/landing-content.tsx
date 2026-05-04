"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { purchaseService } from "@/services/purchase-service";
import { useCart } from "@/hooks/use-cart";
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
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
      {product.description && (
        <p className="mt-1 text-sm text-gray-500">{product.description}</p>
      )}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">
          {formatPrice(product.price, product.currency)}
        </span>
        {isRecurring && <span className="text-sm text-gray-500">/mo</span>}
      </div>
      <div className="mt-1">
        <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {isRecurring ? "Subscription" : "One-time"}
        </span>
      </div>
      <button
        onClick={onAdd}
        className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
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
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">
        Cart ({itemCount})
      </h3>
      <ul className="mt-3 divide-y divide-gray-100">
        {items.map((item) => (
          <li
            key={item.product.id}
            className="flex items-center justify-between py-2"
          >
            <div>
              <p className="text-sm font-medium text-gray-900">
                {item.product.name}
                {item.quantity > 1 && (
                  <span className="text-gray-500"> x{item.quantity}</span>
                )}
              </p>
              <p className="text-xs text-gray-500">
                {formatPrice(
                  item.product.price * item.quantity,
                  item.product.currency,
                )}
              </p>
            </div>
            <button
              onClick={() => removeItem(item.product.id)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="text-sm font-medium text-gray-900">Total</span>
        <span className="text-lg font-bold text-gray-900">
          {formatPrice(total, "USD")}
        </span>
      </div>
      <Link
        href="/cart"
        className="mt-3 block w-full rounded-lg bg-gray-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-gray-800"
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          mono-next
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Full-stack monorepo with admin panel, user dashboard, and API.
        </p>
        <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
          <Link href="/admin" className="hover:text-gray-700 underline">
            Admin Panel
          </Link>
          <span>&middot;</span>
          <Link href="/my-account" className="hover:text-gray-700 underline">
            My Account
          </Link>
          <span>&middot;</span>
          <Link href="/user-login" className="hover:text-gray-700 underline">
            Login
          </Link>
          <span>&middot;</span>
          <Link href="/user-register" className="hover:text-gray-700 underline">
            Register
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-gray-500">Loading products...</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            {subscriptions.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
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
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
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
              <p className="text-center text-sm text-gray-500">
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
