export type PurchaseStatus =
  | "pending"
  | "completed"
  | "refunded"
  | "failed"
  | "active"
  | "cancelled"
  | "expired";

export type PurchaseRecord = {
  id: string;
  userId: string;
  productId: string;
  status: PurchaseStatus;
  amount: number;
  currency: string;
  externalId: string | null;
  startDate: Date;
  endDate: Date | null;
  cancelledAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  product?: {
    id: string;
    name: string;
    slug: string;
    type: string;
    price: number;
    fileUrls: string[];
    accessKeys: string[];
    interval: string | null;
    maxSubUsers: number;
  };
};
