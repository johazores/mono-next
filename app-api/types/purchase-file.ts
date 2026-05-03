export type PurchaseFileRecord = {
  id: string;
  env: string;
  purchaseId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  data: string; // base64
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePurchaseFileInput = {
  purchaseId: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  data: string; // base64
  metadata?: Record<string, unknown>;
};
