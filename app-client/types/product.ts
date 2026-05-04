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
