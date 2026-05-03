import { purchaseFileRepository } from "@/repositories/purchase-file-repository";
import { purchaseRepository } from "@/repositories/purchase-repository";
import type { PurchaseFileRecord, CreatePurchaseFileInput } from "@/types";

export const purchaseFileService = {
  async listByPurchase(purchaseId: string): Promise<PurchaseFileRecord[]> {
    const files = await purchaseFileRepository.findByPurchase(purchaseId);
    return files as PurchaseFileRecord[];
  },

  async getById(id: string): Promise<PurchaseFileRecord | null> {
    const file = await purchaseFileRepository.findById(id);
    return file as PurchaseFileRecord | null;
  },

  async create(input: CreatePurchaseFileInput): Promise<PurchaseFileRecord> {
    const file = await purchaseFileRepository.create({
      purchase: { connect: { id: input.purchaseId } },
      fileName: input.fileName,
      mimeType: input.mimeType ?? "application/octet-stream",
      sizeBytes: input.sizeBytes ?? 0,
      data: input.data,
      metadata: (input.metadata ?? null) as never,
    });
    return file as PurchaseFileRecord;
  },

  async delete(id: string): Promise<void> {
    await purchaseFileRepository.delete(id);
  },

  /**
   * Get all downloadable files for a user's purchases.
   * Returns files grouped by purchase, with product info.
   */
  async getDownloadsForUser(
    userId: string,
  ): Promise<
    {
      purchaseId: string;
      productName: string;
      productType: string;
      purchaseDate: string;
      files: { id: string; fileName: string; mimeType: string; sizeBytes: number }[];
    }[]
  > {
    const purchases = await purchaseRepository.findByUserId(userId);
    const validPurchases = purchases.filter((p) =>
      ["completed", "active"].includes(p.status),
    );

    if (validPurchases.length === 0) return [];

    const purchaseIds = validPurchases.map((p) => p.id);
    const allFiles = await purchaseFileRepository.findByPurchaseIds(purchaseIds);

    // Group files by purchaseId
    const filesByPurchase = new Map<string, typeof allFiles>();
    for (const file of allFiles) {
      const existing = filesByPurchase.get(file.purchaseId) ?? [];
      existing.push(file);
      filesByPurchase.set(file.purchaseId, existing);
    }

    // Only return purchases that have files
    return validPurchases
      .filter((p) => filesByPurchase.has(p.id))
      .map((p) => ({
        purchaseId: p.id,
        productName: p.product?.name ?? "Unknown",
        productType: p.product?.type ?? "digital",
        purchaseDate: p.createdAt.toISOString(),
        files: (filesByPurchase.get(p.id) ?? []).map((f) => ({
          id: f.id,
          fileName: f.fileName,
          mimeType: f.mimeType,
          sizeBytes: f.sizeBytes,
        })),
      }));
  },
};
