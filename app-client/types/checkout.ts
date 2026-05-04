export type CartItem = {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    currency: string;
    type: string;
    paymentModel: "one-time" | "recurring";
    description: string | null;
  };
  quantity: number;
};

export type CheckoutRequest = {
  items: { productId: string; quantity: number }[];
  successUrl: string;
  cancelUrl: string;
  guestEmail?: string;
  guestName?: string;
};

export type CheckoutResponse = {
  redirectUrl: string;
  sessionId: string;
};

export type CheckoutVerifyResponse = {
  purchases: {
    id: string;
    productId: string;
    amount: number;
    status: string;
    product?: { name: string };
  }[];
  user?: {
    id: string;
    email: string;
    name: string;
  };
};

export type PublicPaymentConfig = {
  provider: string;
  mode: string;
  publicKey: string;
};
