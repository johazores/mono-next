import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/purchase-file-repository", () => ({
  purchaseFileRepository: {
    findByPurchase: vi.fn(),
    findById: vi.fn(),
    findByPurchaseIds: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/repositories/purchase-repository", () => ({
  purchaseRepository: {
    findByUserId: vi.fn(),
  },
}));

import { purchaseFileService } from "@/services/purchase-file-service";
import { purchaseFileRepository } from "@/repositories/purchase-file-repository";
import { purchaseRepository } from "@/repositories/purchase-repository";

const fileRepo = vi.mocked(purchaseFileRepository);
const purchaseRepo = vi.mocked(purchaseRepository);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("purchaseFileService.listByPurchase", () => {
  it("returns files for a purchase", async () => {
    fileRepo.findByPurchase.mockResolvedValue([
      { id: "f1", fileName: "guide.pdf" },
    ] as never);

    const result = await purchaseFileService.listByPurchase("pur1");
    expect(result).toHaveLength(1);
    expect(fileRepo.findByPurchase).toHaveBeenCalledWith("pur1");
  });
});

describe("purchaseFileService.getById", () => {
  it("returns file by id", async () => {
    fileRepo.findById.mockResolvedValue({
      id: "f1",
      fileName: "guide.pdf",
      purchaseId: "pur1",
    } as never);

    const result = await purchaseFileService.getById("f1");
    expect(result).not.toBeNull();
    expect(result!.fileName).toBe("guide.pdf");
  });

  it("returns null when not found", async () => {
    fileRepo.findById.mockResolvedValue(null);

    const result = await purchaseFileService.getById("nonexistent");
    expect(result).toBeNull();
  });
});

describe("purchaseFileService.create", () => {
  it("creates a purchase file with defaults", async () => {
    fileRepo.create.mockResolvedValue({
      id: "f_new",
      purchaseId: "pur1",
      fileName: "report.pdf",
      mimeType: "application/octet-stream",
      sizeBytes: 0,
    } as never);

    const result = await purchaseFileService.create({
      purchaseId: "pur1",
      fileName: "report.pdf",
      data: "dGVzdA==",
    });

    expect(result.id).toBe("f_new");
    expect(fileRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "report.pdf",
        mimeType: "application/octet-stream",
        sizeBytes: 0,
        data: "dGVzdA==",
      }),
    );
  });

  it("passes custom mime type and size", async () => {
    fileRepo.create.mockResolvedValue({ id: "f_new" } as never);

    await purchaseFileService.create({
      purchaseId: "pur1",
      fileName: "data.csv",
      mimeType: "text/csv",
      sizeBytes: 1024,
      data: "dGVzdA==",
    });

    expect(fileRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mimeType: "text/csv",
        sizeBytes: 1024,
      }),
    );
  });
});

describe("purchaseFileService.delete", () => {
  it("deletes a file", async () => {
    fileRepo.delete.mockResolvedValue(undefined as never);

    await purchaseFileService.delete("f1");
    expect(fileRepo.delete).toHaveBeenCalledWith("f1");
  });
});

describe("purchaseFileService.getDownloadsForUser", () => {
  it("returns files grouped by purchase", async () => {
    purchaseRepo.findByUserId.mockResolvedValue([
      {
        id: "pur1",
        status: "active",
        createdAt: new Date("2024-01-01"),
        product: { name: "Starter", type: "membership" },
      },
      {
        id: "pur2",
        status: "completed",
        createdAt: new Date("2024-02-01"),
        product: { name: "SEO Report", type: "digital" },
      },
    ] as never);

    fileRepo.findByPurchaseIds.mockResolvedValue([
      {
        id: "f1",
        purchaseId: "pur1",
        fileName: "guide.txt",
        mimeType: "text/plain",
        sizeBytes: 100,
      },
      {
        id: "f2",
        purchaseId: "pur2",
        fileName: "report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 5000,
      },
    ] as never);

    const result = await purchaseFileService.getDownloadsForUser("u1");
    expect(result).toHaveLength(2);
    expect(result[0].productName).toBe("Starter");
    expect(result[0].files).toHaveLength(1);
    expect(result[1].productName).toBe("SEO Report");
  });

  it("excludes purchases without files", async () => {
    purchaseRepo.findByUserId.mockResolvedValue([
      {
        id: "pur1",
        status: "active",
        createdAt: new Date("2024-01-01"),
        product: { name: "Starter", type: "membership" },
      },
    ] as never);

    fileRepo.findByPurchaseIds.mockResolvedValue([]);

    const result = await purchaseFileService.getDownloadsForUser("u1");
    expect(result).toHaveLength(0);
  });

  it("excludes non-valid purchase statuses", async () => {
    purchaseRepo.findByUserId.mockResolvedValue([
      {
        id: "pur1",
        status: "cancelled",
        createdAt: new Date("2024-01-01"),
        product: { name: "Old Plan", type: "membership" },
      },
    ] as never);

    const result = await purchaseFileService.getDownloadsForUser("u1");
    expect(result).toHaveLength(0);
    expect(fileRepo.findByPurchaseIds).not.toHaveBeenCalled();
  });
});
