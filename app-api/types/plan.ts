export type PlanRecord = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePlanInput = {
  name: string;
  slug: string;
  description?: string;
  price?: number;
  currency?: string;
  interval?: string;
  features?: string[];
  sortOrder?: number;
};

export type UpdatePlanInput = {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  currency?: string;
  interval?: string;
  features?: string[];
  isActive?: boolean;
  sortOrder?: number;
};
