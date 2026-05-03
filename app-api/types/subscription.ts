export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "expired"
  | "past_due";

export type SubscriptionRecord = {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  externalId: string | null;
  startDate: Date;
  endDate: Date | null;
  cancelledAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
  plan?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    currency: string;
    interval: string;
  };
};
