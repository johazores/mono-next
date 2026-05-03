import { apiGet, apiPost } from "@/services/api-client";
import type {
  CheckoutRequest,
  CheckoutResponse,
  CheckoutVerifyResponse,
  PublicPaymentConfig,
} from "@/types";

export const checkoutService = {
  async createSession(input: CheckoutRequest): Promise<CheckoutResponse> {
    const result = await apiPost<CheckoutResponse>("/api/checkout", input);
    return result.data!;
  },

  async verify(sessionId: string): Promise<CheckoutVerifyResponse> {
    const result = await apiPost<CheckoutVerifyResponse>(
      "/api/checkout/verify",
      { sessionId },
    );
    return result.data!;
  },

  async getPaymentConfig(): Promise<PublicPaymentConfig> {
    const result = await apiGet<PublicPaymentConfig>("/api/settings/payment");
    return result.data!;
  },
};
