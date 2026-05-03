export type Product = {
  id: string;
  name: string;
  slug: string;
  type: string;
  price: number;
  currency: string;
  description: string | null;
  paymentModel: string;
  interval: string | null;
};
