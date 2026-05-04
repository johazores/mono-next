export type ProductType = "physical" | "digital" | "membership";
export type PaymentModel = "one-time" | "recurring";

export type Product = {
  id: string;
  name: string;
  slug: string;
  type: ProductType;
  price: number;
  currency: string;
  description: string | null;
  paymentModel: PaymentModel;
};

export type ProductPrice = {
  id: string;
  label: string;
  stripePriceId: string;
  stripeProductId?: string;
  mode: "test" | "live";
  amount: number;
  currency: string;
  interval: string | null;
  startDate: string;
  endDate: string | null;
  isDefault: boolean;
};

export type StripeProduct = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
};

export type StripePrice = {
  id: string;
  amount: number;
  currency: string;
  interval: string | null;
  nickname: string | null;
  type: string;
};

export type BrowseStep = "idle" | "products" | "prices";
