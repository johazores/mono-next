import { apiGet, apiPost, apiPut } from "@/services/api-client";
import type { BillingStatus } from "@/types";

export const billingService = {
  async getStatus(): Promise<BillingStatus> {
    const result = await apiGet<BillingStatus>("/api/users/auth/billing");
    return (
      result.data ?? {
        hasStripeCustomer: false,
        portalUrl: null,
        subscriptions: [],
        invoices: [],
        syncedAt: null,
      }
    );
  },

  async createPortalSession(returnUrl: string): Promise<{ url: string }> {
    const result = await apiPost<{ url: string }>("/api/users/auth/billing", {
      returnUrl,
    });
    return result.data!;
  },

  async syncPurchases(): Promise<{ synced: number }> {
    const result = await apiPut<{ synced: number }>("/api/users/auth/billing");
    return result.data ?? { synced: 0 };
  },
};
