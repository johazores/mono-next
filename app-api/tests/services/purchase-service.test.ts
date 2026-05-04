import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/purchase-repository", () => ({
  purchaseRepository: {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    checkOwnership: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    listAll: vi.fn(),
  },
}));

vi.mock("@/repositories/product-repository", () => ({
  productRepository: {
    list: vi.fn(),
    listAll: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/services/membership-service", () => ({
  membershipService: {
    grantFromPurchase: vi.fn(),
  },
}));

import { purchaseService } from "@/services/purchase-service";
import { purchaseRepository } from "@/repositories/purchase-repository";
import { productRepository } from "@/repositories/product-repository";
import { membershipService } from "@/services/membership-service";

const purchaseRepo = vi.mocked(purchaseRepository);
const productRepo = vi.mocked(productRepository);
const memService = vi.mocked(membershipService);

const now = new Date();

function fakeProduct(overrides = {}) {
  return {
    id: "prod-1",
    name: "API Access Pass",
    slug: "api-access-pass",
    description: null,
    type: "digital",
    price: 199.99,
    currency: "USD",
    paymentModel: "one-time",
    accessKeys: ["api.access"],
    isActive: true,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function fakePurchase(overrides = {}) {
  return {
    id: "purchase-1",
    userId: "user-1",
    productId: "prod-1",
    amount: 199.99,
    currency: "USD",
    status: "completed",
    externalId: null,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("purchaseService.create", () => {
  it("creates a purchase and grants membership when product has access keys", async () => {
    const product = fakeProduct();
    const purchase = fakePurchase();
    productRepo.findById.mockResolvedValue(product as never);
    purchaseRepo.create.mockResolvedValue(purchase as never);
    memService.grantFromPurchase.mockResolvedValue(undefined as never);

    const result = await purchaseService.create("user-1", "prod-1");

    expect(purchaseRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 199.99,
        currency: "USD",
        status: "completed",
      }),
    );
    expect(memService.grantFromPurchase).toHaveBeenCalledWith(
      "user-1",
      "purchase-1",
      ["api.access"],
    );
    expect(result).toEqual(purchase);
  });

  it("creates a purchase without granting membership when no access keys", async () => {
    const product = fakeProduct({ accessKeys: [] });
    const purchase = fakePurchase();
    productRepo.findById.mockResolvedValue(product as never);
    purchaseRepo.create.mockResolvedValue(purchase as never);

    await purchaseService.create("user-1", "prod-1");

    expect(memService.grantFromPurchase).not.toHaveBeenCalled();
  });

  it("throws when product not found", async () => {
    productRepo.findById.mockResolvedValue(null as never);

    await expect(
      purchaseService.create("user-1", "nonexistent"),
    ).rejects.toThrow("Product not found.");
  });

  it("throws when product is inactive", async () => {
    productRepo.findById.mockResolvedValue(
      fakeProduct({ isActive: false }) as never,
    );

    await expect(purchaseService.create("user-1", "prod-1")).rejects.toThrow(
      "This product is no longer available.",
    );
  });
});

describe("purchaseService.getHistory", () => {
  it("returns purchase history for a user", async () => {
    const purchases = [fakePurchase()];
    purchaseRepo.findByUserId.mockResolvedValue(purchases as never);

    const result = await purchaseService.getHistory("user-1");

    expect(purchaseRepo.findByUserId).toHaveBeenCalledWith("user-1");
    expect(result).toEqual(purchases);
  });

  it("returns empty array when no purchases", async () => {
    purchaseRepo.findByUserId.mockResolvedValue([] as never);

    const result = await purchaseService.getHistory("user-1");
    expect(result).toEqual([]);
  });
});

describe("purchaseService.checkOwnership", () => {
  it("returns true when user owns the product", async () => {
    purchaseRepo.checkOwnership.mockResolvedValue(fakePurchase() as never);

    const result = await purchaseService.checkOwnership("user-1", "prod-1");
    expect(result).toBe(true);
  });

  it("returns false when user does not own the product", async () => {
    purchaseRepo.checkOwnership.mockResolvedValue(null as never);

    const result = await purchaseService.checkOwnership("user-1", "prod-1");
    expect(result).toBe(false);
  });
});

describe("purchaseService.getById", () => {
  it("returns a purchase by ID", async () => {
    const purchase = fakePurchase();
    purchaseRepo.findById.mockResolvedValue(purchase as never);

    const result = await purchaseService.getById("purchase-1");
    expect(result).toEqual(purchase);
  });

  it("returns null for non-existent purchase", async () => {
    purchaseRepo.findById.mockResolvedValue(null as never);

    const result = await purchaseService.getById("nonexistent");
    expect(result).toBeNull();
  });
});
