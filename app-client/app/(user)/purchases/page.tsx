"use client";

import { useCallback, useEffect, useState } from "react";
import { purchaseService } from "@/services/purchase-service";
import type { Product, Purchase } from "@/types";
import { Button, Modal, Notice } from "@/components/ui";

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStore, setShowStore] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadPurchases = useCallback(async () => {
    try {
      const items = await purchaseService.listPurchases();
      setPurchases(items);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const items = await purchaseService.listPublicProducts();
      setProducts(items);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

  function openStore() {
    loadProducts();
    setShowStore(true);
  }

  async function handleBuy(productId: string) {
    setBuying(productId);
    setMessage(null);
    try {
      await purchaseService.buy(productId);
      setMessage({ type: "success", text: "Purchase completed!" });
      setShowStore(false);
      loadPurchases();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Purchase failed.",
      });
    } finally {
      setBuying(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
          <p className="mt-1 text-sm text-gray-600">
            Your purchase history and available products.
          </p>
        </div>
        <Button onClick={openStore}>Browse Products</Button>
      </div>

      {message && <Notice message={message.text} variant={message.type} />}

      {loading && <p className="text-sm text-gray-400">Loading&hellip;</p>}

      {!loading && purchases.length === 0 && (
        <p className="text-sm text-gray-500">No purchases yet.</p>
      )}

      {purchases.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {p.product?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    ${p.amount.toFixed(2)} {p.currency}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product store modal */}
      {showStore && (
        <Modal
          title="Available Products"
          onClose={() => setShowStore(false)}
          footer={
            <Button variant="secondary" onClick={() => setShowStore(false)}>
              Close
            </Button>
          }
        >
          <div className="space-y-3">
            {products.length === 0 && (
              <p className="text-sm text-gray-400">No products available.</p>
            )}
            {products.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{prod.name}</p>
                  <p className="text-sm text-gray-500">
                    {prod.description || prod.type} · ${prod.price.toFixed(2)}{" "}
                    {prod.currency}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleBuy(prod.id)}
                  disabled={buying === prod.id}
                >
                  {buying === prod.id ? "Buying…" : "Buy"}
                </Button>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
