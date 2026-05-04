"use client";

import { useEffect, useState } from "react";
import { ResourceManager } from "@/components/admin";
import { apiGet, apiPost, apiDelete } from "@/services/api-client";
import type { ResourceField, ResourceItem } from "@/types";

// ---------------------------------------------------------------------------
// Product fields (used by generic ResourceEditor)
// ---------------------------------------------------------------------------

const productFields: ResourceField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "type",
    label: "Type",
    type: "select",
    options: ["physical", "digital", "membership"],
  },
  { name: "price", label: "Price", type: "number" },
  { name: "currency", label: "Currency", type: "text" },
  {
    name: "paymentModel",
    label: "Payment Model",
    type: "select",
    options: ["one-time", "recurring"],
  },
  {
    name: "maxSubUsers",
    label: "Max Sub-Users",
    type: "number",
    help: "0 = none, -1 = unlimited.",
  },
  {
    name: "accessKeys",
    label: "Access Keys",
    type: "checkboxes",
    optionsEndpoint: "/api/admins/features",
    help: "Select the features granted when a user purchases this product.",
  },
  {
    name: "isActive",
    label: "Active",
    type: "select",
    options: ["true", "false"],
  },
  { name: "sortOrder", label: "Sort Order", type: "number" },
];

const emptyProduct: ResourceItem = {
  name: "",
  slug: "",
  description: "",
  type: "digital",
  price: 0,
  currency: "USD",
  paymentModel: "one-time",
  maxSubUsers: 0,
  accessKeys: [],
  isActive: "true",
  sortOrder: 0,
};

// ---------------------------------------------------------------------------
// Stripe product/price browser — fully dynamic, no hardcoded values
// ---------------------------------------------------------------------------

type ProductPrice = {
  id: string;
  label: string;
  stripePriceId: string;
  stripeProductId?: string;
  mode: "test" | "live";
  amount: number;
  currency: string;
  interval: string | null;
  startDate: string;
  endDate: string | null;
  isDefault: boolean;
};

type StripeProduct = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
};

type StripePrice = {
  id: string;
  amount: number;
  currency: string;
  interval: string | null;
  nickname: string | null;
  type: string;
};

type BrowseStep = "idle" | "products" | "prices";

function isActive(price: ProductPrice): boolean {
  const now = new Date();
  if (new Date(price.startDate) > now) return false;
  if (price.endDate && new Date(price.endDate) <= now) return false;
  return true;
}

function formatAmount(
  amount: number,
  currency: string,
  interval: string | null,
) {
  const formatted = `${currency} ${amount.toFixed(2)}`;
  return interval ? `${formatted}/${interval}` : formatted;
}

function ProductPricesEditor({
  productId,
  onPendingChange,
}: {
  productId?: string;
  onPendingChange?: (prices: Record<string, unknown>[]) => void;
}) {
  const isLocal = !productId;
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(!isLocal);

  // Browse state
  const [step, setStep] = useState<BrowseStep>("idle");
  const [stripeProducts, setStripeProducts] = useState<StripeProduct[]>([]);
  const [stripePrices, setStripePrices] = useState<StripePrice[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<StripeProduct | null>(
    null,
  );
  const [stripeMode, setStripeMode] = useState<"test" | "live">("test");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [localCounter, setLocalCounter] = useState(0);

  const endpoint = productId ? `/api/products/${productId}/prices` : "";

  // Load existing prices for saved products
  useEffect(() => {
    if (!productId) return;
    apiGet<{ items: ProductPrice[] }>(endpoint)
      .then((res) => {
        if (res.ok && res.data) setPrices(res.data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [endpoint, productId]);

  // --- Step 1: Load Stripe products ---
  async function openBrowser() {
    setStep("products");
    setFetching(true);
    setMessage("");
    setSearchQuery("");
    try {
      const res = await apiGet<{
        items: StripeProduct[];
        mode: "test" | "live";
      }>("/api/stripe/products");
      if (res.ok && res.data) {
        setStripeProducts(res.data.items);
        setStripeMode(res.data.mode);
      } else {
        setMessage(
          "Failed to load Stripe products. Check your API key in Settings.",
        );
        setStep("idle");
      }
    } catch {
      setMessage("Failed to connect to Stripe.");
      setStep("idle");
    } finally {
      setFetching(false);
    }
  }

  // --- Step 2: Select a product, load its prices ---
  async function selectProduct(product: StripeProduct) {
    setSelectedProduct(product);
    setStep("prices");
    setFetching(true);
    setMessage("");
    try {
      const res = await apiGet<{
        product: StripeProduct;
        prices: StripePrice[];
        mode: "test" | "live";
      }>(`/api/stripe/products/${encodeURIComponent(product.id)}`);
      if (res.ok && res.data) {
        setStripePrices(res.data.prices);
        setStripeMode(res.data.mode);
      } else {
        setMessage("Failed to load prices for this product.");
        setStep("products");
      }
    } catch {
      setMessage("Failed to fetch prices from Stripe.");
      setStep("products");
    } finally {
      setFetching(false);
    }
  }

  // --- Step 3: Add a Stripe price ---
  function toPendingPayload(list: ProductPrice[]) {
    return list.map((p) => ({
      label: p.label,
      stripePriceId: p.stripePriceId,
      stripeProductId: p.stripeProductId,
      mode: p.mode,
      amount: p.amount,
      currency: p.currency,
      interval: p.interval,
      startDate: p.startDate,
      endDate: p.endDate,
      isDefault: p.isDefault,
    })) as Record<string, unknown>[];
  }

  async function addPrice(stripePrice: StripePrice) {
    if (!selectedProduct) return;
    setMessage("");

    // Check if already added
    if (prices.some((p) => p.stripePriceId === stripePrice.id)) {
      setMessage("This price is already added.");
      return;
    }

    const label =
      stripePrice.nickname ||
      `${selectedProduct.name} — ${formatAmount(stripePrice.amount, stripePrice.currency, stripePrice.interval)}`;

    const newPrice: ProductPrice = {
      id: isLocal ? `pending-${localCounter}` : "",
      label,
      stripePriceId: stripePrice.id,
      stripeProductId: selectedProduct.id,
      mode: stripeMode,
      amount: stripePrice.amount,
      currency: stripePrice.currency,
      interval: stripePrice.interval,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: null,
      isDefault: prices.length === 0,
    };

    if (isLocal) {
      setLocalCounter((c) => c + 1);
      const next = [...prices, newPrice];
      setPrices(next);
      onPendingChange?.(toPendingPayload(next));
      closeBrowser();
      setMessage("Price added (will be saved with the product).");
      return;
    }

    // API mode
    setSaving(true);
    try {
      const result = await apiPost<ProductPrice>(endpoint, {
        label: newPrice.label,
        stripePriceId: newPrice.stripePriceId,
        stripeProductId: newPrice.stripeProductId,
        mode: newPrice.mode,
        amount: newPrice.amount,
        currency: newPrice.currency,
        interval: newPrice.interval,
        startDate: newPrice.startDate,
        isDefault: newPrice.isDefault,
      });
      if (result.ok && result.data) {
        setPrices((prev) => [...prev, result.data as ProductPrice]);
      }
      closeBrowser();
      setMessage("Price saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (isLocal) {
      const next = prices.filter((p) => p.id !== id);
      setPrices(next);
      onPendingChange?.(toPendingPayload(next));
      return;
    }
    try {
      await apiDelete(`${endpoint}/${id}`);
      setPrices((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  function closeBrowser() {
    setStep("idle");
    setStripeProducts([]);
    setStripePrices([]);
    setSelectedProduct(null);
    setSearchQuery("");
  }

  const filteredProducts = searchQuery
    ? stripeProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.id.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : stripeProducts;

  if (loading) return <p className="text-xs text-gray-400">Loading prices…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800">
          Stripe Prices
          <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-normal text-gray-500">
            {stripeMode} mode
          </span>
        </h4>
        {step === "idle" && (
          <button
            type="button"
            onClick={openBrowser}
            className="rounded-md bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            + Add from Stripe
          </button>
        )}
      </div>

      {message && (
        <p
          className={`text-xs ${message.includes("saved") || message.includes("added") ? "text-green-600" : "text-red-600"}`}
        >
          {message}
        </p>
      )}

      {/* ---- Product browser ---- */}
      {step === "products" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700">
              Select a Stripe Product
            </p>
            <button
              type="button"
              onClick={closeBrowser}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>

          {fetching ? (
            <p className="text-xs text-gray-400">
              Loading products from Stripe…
            </p>
          ) : (
            <>
              {stripeProducts.length > 5 && (
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products…"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
              {filteredProducts.length === 0 ? (
                <p className="text-xs text-gray-400">
                  {stripeProducts.length === 0
                    ? "No products found in Stripe. Create one in your Stripe Dashboard first."
                    : "No products match your search."}
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => selectProduct(product)}
                      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-left transition hover:border-blue-300 hover:bg-blue-50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </p>
                        {product.description && (
                          <p className="text-xs text-gray-500 truncate">
                            {product.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-gray-400">
                        {product.id}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ---- Price picker ---- */}
      {step === "prices" && selectedProduct && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-700 truncate">
                {selectedProduct.name}
              </p>
              {selectedProduct.description && (
                <p className="text-[11px] text-gray-500 truncate">
                  {selectedProduct.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setStep("products")}
                className="text-xs text-blue-600 hover:underline"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={closeBrowser}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>

          {fetching ? (
            <p className="text-xs text-gray-400">Loading prices…</p>
          ) : stripePrices.length === 0 ? (
            <p className="text-xs text-gray-400">
              No active prices found for this product. Create one in your Stripe
              Dashboard.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-[11px] text-gray-500">
                Click a price to add it:
              </p>
              {stripePrices.map((sp) => {
                const alreadyAdded = prices.some(
                  (p) => p.stripePriceId === sp.id,
                );
                return (
                  <button
                    key={sp.id}
                    type="button"
                    disabled={alreadyAdded || saving}
                    onClick={() => addPrice(sp)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left transition ${
                      alreadyAdded
                        ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-900">
                        {formatAmount(sp.amount, sp.currency, sp.interval)}
                      </span>
                      {sp.nickname && (
                        <span className="ml-2 text-xs text-gray-500">
                          {sp.nickname}
                        </span>
                      )}
                      <span className="ml-2 rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-500">
                        {sp.interval ? "recurring" : "one-time"}
                      </span>
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="font-mono text-[10px] text-gray-400">
                        {sp.id}
                      </span>
                      {alreadyAdded ? (
                        <span className="text-[10px] text-green-600">
                          Added
                        </span>
                      ) : (
                        <span className="text-xs text-blue-600">+ Add</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---- Added prices table ---- */}
      {prices.length === 0 ? (
        <p className="text-xs text-gray-400">
          No prices configured. Add a Stripe price to enable checkout.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 text-xs">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-1.5 text-left font-medium text-gray-600">
                  Label
                </th>
                <th className="px-3 py-1.5 text-left font-medium text-gray-600">
                  Mode
                </th>
                <th className="px-3 py-1.5 text-left font-medium text-gray-600">
                  Amount
                </th>
                <th className="px-3 py-1.5 text-left font-medium text-gray-600">
                  Status
                </th>
                <th className="px-3 py-1.5 text-right font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {prices.map((price) => (
                <tr key={price.id}>
                  <td className="px-3 py-1.5 font-medium text-gray-900">
                    {price.label}
                    {price.isDefault && (
                      <span className="ml-1 rounded bg-blue-100 px-1 py-0.5 text-[10px] text-blue-700">
                        default
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={`rounded px-1 py-0.5 ${
                        price.mode === "live"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {price.mode}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-gray-700">
                    {formatAmount(price.amount, price.currency, price.interval)}
                  </td>
                  <td className="px-3 py-1.5">
                    <span
                      className={`rounded px-1 py-0.5 ${
                        isActive(price)
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {isActive(price) ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => handleDelete(price.id)}
                      className="text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Products page
// ---------------------------------------------------------------------------

export default function ProductsPage() {
  return (
    <ResourceManager
      title="Products"
      endpoint="/api/products"
      fields={productFields}
      getTitle={(item) => String(item.name)}
      getSubtitle={(item) =>
        `${item.slug} · $${item.price}${item.paymentModel === "recurring" ? "/mo" : ""} · ${item.type}`
      }
      emptyItem={emptyProduct}
      renderEditorExtra={(item, setField) => (
        <div className="col-span-2 mt-4 space-y-6 border-t border-gray-200 pt-4">
          <ProductPricesEditor
            productId={item.id as string | undefined}
            onPendingChange={(prices) => setField("prices", prices)}
          />
        </div>
      )}
    />
  );
}
