import { apiGet, apiPost } from "@/services/api-client";
import type { Product, Purchase } from "@/types";

export const purchaseService = {
  async listPurchases(): Promise<Purchase[]> {
    const result = await apiGet<{ items: Purchase[] }>(
      "/api/users/auth/purchases",
    );
    return result.data?.items ?? [];
  },

  async listPublicProducts(): Promise<Product[]> {
    const result = await apiGet<{ items: Product[] }>("/api/products/public");
    return result.data?.items ?? [];
  },

  async buy(productId: string): Promise<void> {
    await apiPost("/api/users/auth/purchases", { productId });
  },
};
