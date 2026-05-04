import type { PaymentConfig, StripeSubscription, StripeInvoice } from "@/types";

export type { StripeSubscription, StripeInvoice };

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
  subscriptionId: string | null;
  paymentIntentId: string | null;
  metadata: Record<string, string>;
  lineItems: { priceId: string; quantity: number }[];
};

export type BillingPortalResult = {
  url: string;
};

/* ------------------------------------------------------------------ */
/* Internal Stripe API response shapes (used by providers/catalog)     */
/* ------------------------------------------------------------------ */

export type StripeSession = {
  id: string;
  url: string;
  payment_status: "paid" | "unpaid" | "no_payment_required";
  customer: string | null;
  customer_email: string | null;
  customer_details?: { email: string | null; name: string | null };
  subscription: string | null;
  payment_intent: string | null;
  metadata: Record<string, string>;
};

export type StripeLineItem = {
  data: { price: { id: string }; quantity: number }[];
};

export type StripeProductResponse = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  active: boolean;
  metadata: Record<string, unknown>;
};

export type StripePriceResponse = {
  id: string;
  unit_amount: number | null;
  currency: string;
  recurring: { interval: string } | null;
  nickname: string | null;
  type: string;
  active: boolean;
  product: string;
};

export type StripeList<T> = { data: T[] };

/* ------------------------------------------------------------------ */
/* Provider interface                                                   */
/* ------------------------------------------------------------------ */

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
