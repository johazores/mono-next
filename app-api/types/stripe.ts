import type { PaymentMode } from "./payment";

/* ------------------------------------------------------------------ */
/* Types returned by the Stripe catalog browsing endpoints             */
/* ------------------------------------------------------------------ */

export type StripeProductSummary = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  active: boolean;
  metadata: Record<string, unknown>;
};

export type StripePriceSummary = {
  id: string;
  amount: number;
  currency: string;
  interval: string | null;
  nickname: string | null;
  type: string;
  active: boolean;
};

export type StripePriceLookup = {
  stripePriceId: string;
  stripeProductId: string;
  amount: number;
  currency: string;
  interval: string | null;
  label: string;
  mode: PaymentMode;
  active: boolean;
};

export type StripeProductListResult = {
  items: StripeProductSummary[];
  mode: PaymentMode;
};

export type StripeProductDetailResult = {
  product: StripeProductSummary;
  prices: StripePriceSummary[];
  mode: PaymentMode;
};
