import { apiGet, apiPost, apiDelete } from "./api-client";
import type { ProductPrice, StripeProduct, StripePrice } from "@/types";

export const productService = {
  async listPrices(productId: string) {
    return apiGet<{ items: ProductPrice[] }>(
      `/api/products/${productId}/prices`,
    );
  },

  async createPrice(
    productId: string,
    data: Omit<ProductPrice, "id" | "endDate">,
  ) {
    return apiPost<ProductPrice>(`/api/products/${productId}/prices`, data);
  },

  async deletePrice(productId: string, priceId: string) {
    return apiDelete(`/api/products/${productId}/prices/${priceId}`);
  },

  async listStripeProducts() {
    return apiGet<{ items: StripeProduct[]; mode: "test" | "live" }>(
      "/api/stripe/products",
    );
  },

  async getStripeProduct(stripeProductId: string) {
    return apiGet<{
      product: StripeProduct;
      prices: StripePrice[];
      mode: "test" | "live";
    }>(`/api/stripe/products/${encodeURIComponent(stripeProductId)}`);
  },
};
