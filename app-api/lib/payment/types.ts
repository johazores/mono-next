import type { PaymentConfig } from "@/types";

export type ProviderLineItem = {
  priceId: string;
  quantity: number;
  productId: string; // internal ID for metadata
};

export type CreateSessionInput = {
  lineItems: ProviderLineItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  customerId?: string;
  metadata?: Record<string, string>;
  mode: "payment" | "subscription";
};

export type CreateSessionResult = {
  sessionId: string;
  redirectUrl: string;
};

export type VerifiedSession = {
  sessionId: string;
  paymentStatus: "paid" | "unpaid" | "no_payment_required";
  customerId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  metadata: Record<string, string>;
  lineItems: { priceId: string; quantity: number }[];
};

export type BillingPortalResult = {
  url: string;
};

export type StripeSubscription = {
  id: string;
  status: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  interval: string | null; // derived from Stripe price (month | year | week | day)
  items: { priceId: string; productId: string }[];
};

export type StripeInvoice = {
  id: string;
  status: string; // draft | open | paid | void | uncollectible
  amountPaid: number; // in major currency units (e.g. dollars)
  currency: string;
  subscriptionId: string | null;
  stripeProductId: string | null; // first line item product
  stripePriceId: string | null; // first line item price
  periodStart: number;
  periodEnd: number;
  hostedUrl: string | null;
  pdfUrl: string | null;
  created: number;
};

export interface PaymentProviderInterface {
  createCheckoutSession(
    input: CreateSessionInput,
    config: PaymentConfig,
  ): Promise<CreateSessionResult>;

  verifySession(
    sessionId: string,
    config: PaymentConfig,
  ): Promise<VerifiedSession>;

  findOrCreateCustomer(
    email: string,
    name: string | undefined,
    config: PaymentConfig,
  ): Promise<string>;

  createBillingPortalSession(
    customerId: string,
    returnUrl: string,
    config: PaymentConfig,
  ): Promise<BillingPortalResult>;

  getCustomerSubscriptions(
    customerId: string,
    config: PaymentConfig,
  ): Promise<StripeSubscription[]>;

  getCustomerInvoices(
    customerId: string,
    config: PaymentConfig,
  ): Promise<StripeInvoice[]>;
}
