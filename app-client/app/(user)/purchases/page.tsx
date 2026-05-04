"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
import { swrListFetcher } from "@/lib/swr";
import { purchaseService } from "@/services/purchase-service";
import type { Product, Purchase } from "@/types";
import {
  Button,
  Modal,
  Notice,
  PageHeader,
  StatusBadge,
  EmptyState,
} from "@/components/ui";

export default function PurchasesPage() {
  const {
    data: purchases = [],
    isLoading: loading,
    mutate: mutatePurchases,
  } = useSWR("/api/users/auth/purchases", (url: string) =>
    swrListFetcher<Purchase>(url),
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [showStore, setShowStore] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      const items = await purchaseService.listPublicProducts();
      setProducts(items);
    } catch {
      // silent
    }
  }, []);

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
      mutatePurchases();
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
      <PageHeader
        title="Purchases"
        description="Your purchase history and available products."
        action={<Button onClick={openStore}>Browse Products</Button>}
      />

      {message && <Notice message={message.text} variant={message.type} />}

      {loading && <p className="text-sm text-muted">Loading&hellip;</p>}

      {!loading && purchases.length === 0 && (
        <EmptyState message="No purchases yet." />
      )}

      {purchases.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-background">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-surface">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchases.map((p) => (
                <tr
                  key={p.id}
                  className="transition-colors hover:bg-surface/60"
                >
                  <td className="px-4 py-3 text-sm text-foreground">
                    {p.product?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">
                    ${p.amount.toFixed(2)} {p.currency}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <StatusBadge
                      status={p.status}
                      variant={p.status === "completed" ? "success" : "warning"}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted">
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
              <p className="text-sm text-muted">No products available.</p>
            )}
            {products.map((prod) => (
              <div
                key={prod.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div>
                  <p className="font-medium text-foreground">{prod.name}</p>
                  <p className="text-sm text-muted">
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
