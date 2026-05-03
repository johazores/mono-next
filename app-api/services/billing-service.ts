import { userRepository } from "@/repositories/user-repository";
import { purchaseRepository } from "@/repositories/purchase-repository";
import { productRepository } from "@/repositories/product-repository";
import { getPaymentProvider, getPaymentConfig } from "@/lib/payment";
import type { StripeSubscription, StripeInvoice } from "@/lib/payment/types";

// Throttle sync per user — skip if synced within the last 5 minutes
const SYNC_THROTTLE_MS = 5 * 60 * 1000;
const lastSyncMap = new Map<string, number>();

export type BillingStatus = {
  hasStripeCustomer: boolean;
  portalUrl: string | null;
  subscriptions: StripeSubscription[];
  invoices: StripeInvoice[];
  syncedAt: string | null;
};

export const billingService = {
  /**
   * Fire-and-forget background sync. Swallows errors so it never
   * blocks or breaks the calling request (login, /me, admin view).
   */
  syncInBackground(userId: string): void {
    billingService.syncPurchases(userId).catch(() => {
      // Intentionally swallowed — sync is best-effort
    });
  },

  /**
   * Force-sync bypassing the throttle. Used when the user explicitly
   * clicks "Sync from Stripe" in the UI.
   */
  async forceSyncPurchases(userId: string): Promise<{ synced: number }> {
    lastSyncMap.delete(userId);
    return billingService.syncPurchases(userId);
  },

  /**
   * Ensure the user has a Stripe customer ID.
   * If not, create one via Stripe and save it.
   */
  async ensureStripeCustomer(userId: string): Promise<string> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found.");

    if (user.stripeCustomerId) return user.stripeCustomerId;

    const config = await getPaymentConfig();
    const provider = getPaymentProvider(config.provider);

    const customerId = await provider.findOrCreateCustomer(
      user.email,
      user.name,
      config,
    );

    await userRepository.update(userId, { stripeCustomerId: customerId });
    return customerId;
  },

  /**
   * Create a Stripe Billing Portal session for the user.
   * Allows them to manage payment methods, view invoices, cancel subscriptions.
   */
  async createPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const customerId = await billingService.ensureStripeCustomer(userId);

    const config = await getPaymentConfig();
    const provider = getPaymentProvider(config.provider);

    return provider.createBillingPortalSession(customerId, returnUrl, config);
  },

  /**
   * Fetch the user's current Stripe subscriptions, invoices, and billing status.
   */
  async getStatus(userId: string): Promise<BillingStatus> {
    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found.");

    if (!user.stripeCustomerId) {
      return {
        hasStripeCustomer: false,
        portalUrl: null,
        subscriptions: [],
        invoices: [],
        syncedAt: null,
      };
    }

    const config = await getPaymentConfig();
    const provider = getPaymentProvider(config.provider);

    const [subscriptions, invoices] = await Promise.all([
      provider.getCustomerSubscriptions(user.stripeCustomerId, config),
      provider.getCustomerInvoices(user.stripeCustomerId, config),
    ]);

    const lastSync = lastSyncMap.get(userId);

    return {
      hasStripeCustomer: true,
      portalUrl: null,
      subscriptions,
      invoices,
      syncedAt: lastSync ? new Date(lastSync).toISOString() : null,
    };
  },

  /**
   * Sync Stripe invoices & subscriptions into local Purchase records.
   * Upserts by externalId (Stripe invoice ID or subscription ID).
   * Returns the number of records synced.
   */
  async syncPurchases(userId: string): Promise<{ synced: number }> {
    // Throttle: skip if this user was synced within the last 5 minutes
    const lastSync = lastSyncMap.get(userId);
    if (lastSync && Date.now() - lastSync < SYNC_THROTTLE_MS) {
      return { synced: 0 };
    }

    const user = await userRepository.findById(userId);
    if (!user) throw new Error("User not found.");

    if (!user.stripeCustomerId) {
      return { synced: 0 };
    }

    const config = await getPaymentConfig();
    const provider = getPaymentProvider(config.provider);

    const [subscriptions, invoices] = await Promise.all([
      provider.getCustomerSubscriptions(user.stripeCustomerId, config),
      provider.getCustomerInvoices(user.stripeCustomerId, config),
    ]);

    // Build a lookup of local products by Stripe product/price ID
    const allProducts = await productRepository.listAll();
    const productByStripeId = new Map<string, (typeof allProducts)[0]>();
    for (const p of allProducts) {
      if (config.mode === "live") {
        if (p.stripeLiveProductId)
          productByStripeId.set(p.stripeLiveProductId, p);
        if (p.stripeLivePriceId) productByStripeId.set(p.stripeLivePriceId, p);
      } else {
        if (p.stripeTestProductId)
          productByStripeId.set(p.stripeTestProductId, p);
        if (p.stripeTestPriceId) productByStripeId.set(p.stripeTestPriceId, p);
      }
    }

    let synced = 0;

    // Sync subscriptions → Purchase with externalId = sub.id
    for (const sub of subscriptions) {
      const localProduct = matchProduct(sub.items, productByStripeId);
      if (!localProduct) continue;

      await upsertPurchase(userId, localProduct.id, {
        externalId: sub.id,
        amount: localProduct.price,
        currency: localProduct.currency,
        status: mapSubscriptionStatus(sub.status),
        endDate: new Date(sub.currentPeriodEnd * 1000),
        cancelledAt: sub.cancelAtPeriodEnd
          ? new Date(sub.currentPeriodEnd * 1000)
          : null,
        metadata: {
          stripeType: "subscription",
          interval: sub.interval,
          syncedAt: new Date().toISOString(),
        },
      });
      synced++;
    }

    // Sync paid invoices → Purchase with externalId = invoice.id
    // Skip invoices that are tied to a subscription we already synced
    const syncedSubIds = new Set(subscriptions.map((s) => s.id));

    for (const inv of invoices) {
      // Skip non-paid invoices
      if (inv.status !== "paid") continue;

      // If this invoice belongs to a subscription we already synced, skip it
      // to avoid duplicate Purchase records
      if (inv.subscriptionId && syncedSubIds.has(inv.subscriptionId)) continue;

      const localProduct = matchInvoiceProduct(inv, productByStripeId);
      if (!localProduct) continue;

      await upsertPurchase(userId, localProduct.id, {
        externalId: inv.id,
        amount: inv.amountPaid,
        currency: inv.currency,
        status: "completed",
        startDate: new Date(inv.periodStart * 1000),
        endDate: inv.periodEnd ? new Date(inv.periodEnd * 1000) : null,
        metadata: {
          stripeType: "invoice",
          hostedUrl: inv.hostedUrl,
          pdfUrl: inv.pdfUrl,
          syncedAt: new Date().toISOString(),
        },
      });
      synced++;
    }

    lastSyncMap.set(userId, Date.now());
    return { synced };
  },
};

// --- helpers ---

function mapSubscriptionStatus(
  stripeStatus: string,
): "active" | "cancelled" | "expired" | "pending" {
  switch (stripeStatus) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
      return "cancelled";
    case "past_due":
    case "unpaid":
      return "pending";
    case "incomplete":
    case "incomplete_expired":
      return "expired";
    default:
      return "active";
  }
}

function matchProduct(
  items: { priceId: string; productId: string }[],
  lookup: Map<string, { id: string }>,
): { id: string; price: number; currency: string } | null {
  for (const item of items) {
    const byProduct = lookup.get(item.productId);
    if (byProduct)
      return byProduct as { id: string; price: number; currency: string };
    const byPrice = lookup.get(item.priceId);
    if (byPrice)
      return byPrice as { id: string; price: number; currency: string };
  }
  return null;
}

function matchInvoiceProduct(
  inv: StripeInvoice,
  lookup: Map<string, { id: string }>,
): { id: string; price: number; currency: string } | null {
  if (inv.stripeProductId) {
    const m = lookup.get(inv.stripeProductId);
    if (m) return m as { id: string; price: number; currency: string };
  }
  if (inv.stripePriceId) {
    const m = lookup.get(inv.stripePriceId);
    if (m) return m as { id: string; price: number; currency: string };
  }
  return null;
}

async function upsertPurchase(
  userId: string,
  productId: string,
  data: {
    externalId: string;
    amount: number;
    currency: string;
    status: string;
    startDate?: Date;
    endDate?: Date | null;
    cancelledAt?: Date | null;
    metadata?: Record<string, unknown>;
  },
) {
  const existing = await purchaseRepository.findByExternalId(data.externalId);

  if (existing) {
    return purchaseRepository.update(existing.id, {
      status: data.status,
      amount: data.amount,
      currency: data.currency,
      endDate: data.endDate ?? existing.endDate,
      cancelledAt: data.cancelledAt ?? existing.cancelledAt,
      metadata: data.metadata as never,
    });
  }

  return purchaseRepository.create({
    user: { connect: { id: userId } },
    product: { connect: { id: productId } },
    externalId: data.externalId,
    amount: data.amount,
    currency: data.currency,
    status: data.status,
    startDate: data.startDate,
    endDate: data.endDate,
    cancelledAt: data.cancelledAt,
    metadata: (data.metadata ?? null) as never,
  });
}
