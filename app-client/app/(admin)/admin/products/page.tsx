"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ResourceManager } from "@/components/admin";
import { apiGet, apiPost, apiPut, apiDelete } from "@/services/api-client";
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
    name: "interval",
    label: "Billing Interval",
    type: "select",
    options: ["month", "year"],
    help: "For recurring products only.",
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
  {
    name: "stripeTestProductId",
    label: "Stripe Test Product ID",
    type: "text",
    help: "Stripe product ID for test mode (e.g. prod_...).",
  },
  {
    name: "stripeTestPriceId",
    label: "Stripe Test Price ID",
    type: "text",
    help: "Stripe price ID for test mode (e.g. price_...).",
  },
  {
    name: "stripeLiveProductId",
    label: "Stripe Live Product ID",
    type: "text",
    help: "Stripe product ID for live mode.",
  },
  {
    name: "stripeLivePriceId",
    label: "Stripe Live Price ID",
    type: "text",
    help: "Stripe price ID for live mode.",
  },
];

const emptyProduct: ResourceItem = {
  name: "",
  slug: "",
  description: "",
  type: "digital",
  price: 0,
  currency: "USD",
  paymentModel: "one-time",
  interval: "month",
  maxSubUsers: 0,
  fileUrls: [],
  accessKeys: [],
  isActive: "true",
  sortOrder: 0,
  stripeTestProductId: "",
  stripeTestPriceId: "",
  stripeLiveProductId: "",
  stripeLivePriceId: "",
};

// ---------------------------------------------------------------------------
// File URLs editor (inline in product modal)
// ---------------------------------------------------------------------------

function FileUrlsEditor({
  urls,
  onChange,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
}) {
  const inputClass =
    "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          File URLs
          <span className="ml-1 text-xs font-normal text-gray-400">
            Download links for digital products
          </span>
        </label>
        <button
          type="button"
          onClick={() => onChange([...urls, ""])}
          className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          + Add URL
        </button>
      </div>
      {urls.length === 0 && (
        <p className="text-xs text-gray-400">No file URLs added.</p>
      )}
      {urls.map((url, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              const next = [...urls];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder="https://example.com/file.pdf"
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => onChange(urls.filter((_, j) => j !== i))}
            className="shrink-0 rounded-md px-2 text-sm text-red-600 hover:bg-red-50"
          >
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product prices editor (inline in product modal)
// ---------------------------------------------------------------------------

type ProductPrice = {
  id: string;
  label: string;
  stripePriceId: string;
  mode: "test" | "live";
  amount: number;
  currency: string;
  interval: string | null;
  startDate: string;
  endDate: string | null;
  isDefault: boolean;
};

type PriceForm = {
  label: string;
  stripePriceId: string;
  mode: "test" | "live";
  amount: string;
  currency: string;
  interval: string;
  startDate: string;
  endDate: string;
  isDefault: boolean;
};

const emptyPriceForm: PriceForm = {
  label: "",
  stripePriceId: "",
  mode: "test",
  amount: "0",
  currency: "USD",
  interval: "",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  isDefault: false,
};

function isActive(price: ProductPrice): boolean {
  const now = new Date();
  if (new Date(price.startDate) > now) return false;
  if (price.endDate && new Date(price.endDate) <= now) return false;
  return true;
}

function ProductPricesEditor({ productId }: { productId: string }) {
  const [prices, setPrices] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PriceForm>(emptyPriceForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const endpoint = `/api/products/${productId}/prices`;

  useEffect(() => {
    apiGet<{ items: ProductPrice[] }>(endpoint)
      .then((res) => {
        if (res.ok && res.data) setPrices(res.data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [endpoint]);

  function startCreate() {
    setEditing("new");
    setForm(emptyPriceForm);
    setMessage("");
  }

  function startEdit(price: ProductPrice) {
    setEditing(price.id);
    setForm({
      label: price.label,
      stripePriceId: price.stripePriceId,
      mode: price.mode,
      amount: String(price.amount),
      currency: price.currency,
      interval: price.interval ?? "",
      startDate: price.startDate
        ? new Date(price.startDate).toISOString().slice(0, 10)
        : "",
      endDate: price.endDate
        ? new Date(price.endDate).toISOString().slice(0, 10)
        : "",
      isDefault: price.isDefault,
    });
    setMessage("");
  }

  function cancel() {
    setEditing(null);
    setForm(emptyPriceForm);
    setMessage("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const payload = {
      label: form.label,
      stripePriceId: form.stripePriceId,
      mode: form.mode,
      amount: parseFloat(form.amount),
      currency: form.currency,
      interval: form.interval || undefined,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      isDefault: form.isDefault,
    };

    try {
      if (editing === "new") {
        const result = await apiPost<ProductPrice>(endpoint, payload);
        if (result.ok && result.data)
          setPrices((prev) => [result.data as ProductPrice, ...prev]);
      } else {
        const result = await apiPut<ProductPrice>(
          `${endpoint}/${editing}`,
          payload,
        );
        if (result.ok && result.data)
          setPrices((prev) =>
            prev.map((p) =>
              p.id === editing ? (result.data as ProductPrice) : p,
            ),
          );
      }
      setEditing(null);
      setForm(emptyPriceForm);
      setMessage("Price saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await apiDelete(`${endpoint}/${id}`);
      setPrices((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  if (loading) return <p className="text-xs text-gray-400">Loading prices…</p>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-800">Prices</h4>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-200"
        >
          + Add Price
        </button>
      </div>

      {message && (
        <p
          className={`text-xs ${message.includes("saved") ? "text-green-600" : "text-red-600"}`}
        >
          {message}
        </p>
      )}

      {editing !== null && (
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
        >
          <p className="text-xs font-semibold text-gray-700">
            {editing === "new" ? "New Price" : "Edit Price"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Label
              </label>
              <input
                type="text"
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="e.g. Monthly 2024"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Stripe Price ID
              </label>
              <input
                type="text"
                value={form.stripePriceId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stripePriceId: e.target.value }))
                }
                placeholder="price_..."
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Mode
              </label>
              <select
                value={form.mode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    mode: e.target.value as "test" | "live",
                  }))
                }
                className={inputClass}
              >
                <option value="test">Test</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Currency
              </label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) =>
                  setForm((f) => ({ ...f, currency: e.target.value }))
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Interval
              </label>
              <select
                value={form.interval}
                onChange={(e) =>
                  setForm((f) => ({ ...f, interval: e.target.value }))
                }
                className={inputClass}
              >
                <option value="">None (one-time)</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">
                End Date
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
                className={inputClass}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) =>
                setForm((f) => ({ ...f, isDefault: e.target.checked }))
              }
              className="rounded border-gray-300"
            />
            Default price
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {prices.length === 0 ? (
        <p className="text-xs text-gray-400">
          No prices configured. Legacy product price fields will be used at
          checkout.
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
                    {price.currency} {price.amount.toFixed(2)}
                    {price.interval && (
                      <span className="text-gray-400">/{price.interval}</span>
                    )}
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
                      onClick={() => startEdit(price)}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(price.id)}
                      className="ml-2 text-red-600 hover:underline"
                    >
                      Delete
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
        `${item.slug} · $${item.price}${item.paymentModel === "recurring" ? `/${item.interval}` : ""} · ${item.type}`
      }
      emptyItem={emptyProduct}
      renderEditorExtra={(item, setField) => (
        <div className="col-span-2 mt-4 space-y-6 border-t border-gray-200 pt-4">
          <FileUrlsEditor
            urls={(item.fileUrls as string[]) ?? []}
            onChange={(urls) => setField("fileUrls", urls)}
          />
          {item.id && <ProductPricesEditor productId={item.id} />}
        </div>
      )}
    />
  );
}
