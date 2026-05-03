export type Purchase = {
  id: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  product?: { name: string; type: string };
};
