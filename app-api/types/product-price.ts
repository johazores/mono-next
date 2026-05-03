export type ProductPriceRecord = {
  id: string;
  env: string;
  productId: string;
  label: string;
  stripePriceId: string;
  mode: "test" | "live";
  amount: number;
  currency: string;
  interval: string | null;
  startDate: Date;
  endDate: Date | null;
  isDefault: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateProductPriceInput = {
  productId: string;
  label: string;
  stripePriceId: string;
  mode: "test" | "live";
  amount: number;
  currency?: string;
  interval?: string;
  startDate?: string;
  endDate?: string;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
};

export type UpdateProductPriceInput = {
  label?: string;
  stripePriceId?: string;
  mode?: "test" | "live";
  amount?: number;
  currency?: string;
  interval?: string;
  startDate?: string;
  endDate?: string;
  isDefault?: boolean;
  metadata?: Record<string, unknown>;
};
