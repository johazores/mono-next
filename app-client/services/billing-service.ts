import { apiGet, apiPost, apiPut } from "@/services/api-client";

export type StripeSubscription = {
  id: string;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  interval: string | null;
  items: { priceId: string; productId: string }[];
};

export type StripeInvoice = {
  id: string;
  status: string;
  amountPaid: number;
  currency: string;
  subscriptionId: string | null;
  periodStart: number;
  periodEnd: number;
  hostedUrl: string | null;
  pdfUrl: string | null;
  created: number;
};

export type BillingStatus = {
  hasStripeCustomer: boolean;
  portalUrl: string | null;
  subscriptions: StripeSubscription[];
  invoices: StripeInvoice[];
  syncedAt: string | null;
};

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
