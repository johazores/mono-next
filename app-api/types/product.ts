export type ProductType = "physical" | "digital" | "membership";
export type PaymentModel = "one-time" | "recurring";

export type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  type: ProductType;
  price: number;
  currency: string;
  paymentModel: PaymentModel;
  interval: string | null;
  maxSubUsers: number;
  fileUrls: string[];
  accessKeys: string[];
  stripeTestProductId: string | null;
  stripeTestPriceId: string | null;
  stripeLiveProductId: string | null;
  stripeLivePriceId: string | null;
  isActive: boolean;
  sortOrder: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProductInput = {
  name: string;
  slug: string;
  description?: string;
  type?: ProductType;
  price?: number;
  currency?: string;
  paymentModel?: PaymentModel;
  interval?: string;
  maxSubUsers?: number;
  fileUrls?: string[];
  accessKeys?: string[];
  stripeTestProductId?: string;
  stripeTestPriceId?: string;
  stripeLiveProductId?: string;
  stripeLivePriceId?: string;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
};

export type UpdateProductInput = {
  name?: string;
  slug?: string;
  description?: string;
  type?: ProductType;
  price?: number;
  currency?: string;
  paymentModel?: PaymentModel;
  interval?: string;
  maxSubUsers?: number;
  fileUrls?: string[];
  accessKeys?: string[];
  stripeTestProductId?: string;
  stripeTestPriceId?: string;
  stripeLiveProductId?: string;
  stripeLivePriceId?: string;
  isActive?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown>;
};
