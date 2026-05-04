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
  paymentIntentId: string | null;
  stripeProductId: string | null;
  stripePriceId: string | null;
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
