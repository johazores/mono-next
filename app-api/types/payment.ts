export type PaymentMode = "test" | "live";

export type PaymentProviderName = "stripe" | "woocommerce";

export type PaymentConfig = {
  provider: PaymentProviderName;
  mode: PaymentMode;
  publicKey: string;
  secretKey: string;
};

export type PublicPaymentConfig = {
  provider: PaymentProviderName;
  mode: PaymentMode;
  publicKey: string;
};

export type CheckoutItem = {
  productId: string;
  quantity: number;
};

export type CheckoutSessionRecord = {
  id: string;
  env: string;
  sessionId: string;
  userId: string | null;
  guestEmail: string | null;
  guestName: string | null;
  items: CheckoutItem[];
  status: "pending" | "completed" | "expired";
  provider: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateCheckoutInput = {
  items: CheckoutItem[];
  successUrl: string;
  cancelUrl: string;
  guestEmail?: string;
  guestName?: string;
};

export type CheckoutResult = {
  redirectUrl: string;
  sessionId: string;
};
