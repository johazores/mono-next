import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/product-price-repository", () => ({
  productPriceRepository: {
    findByProduct: vi.fn(),
    findActivePrice: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { productPriceService } from "@/services/product-price-service";
import { productPriceRepository } from "@/repositories/product-price-repository";

const repo = vi.mocked(productPriceRepository);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("productPriceService.listByProduct", () => {
  it("returns prices for a product", async () => {
    const prices = [
      { id: "pp1", productId: "p1", label: "Monthly", amount: 9.99 },
      { id: "pp2", productId: "p1", label: "Yearly", amount: 99.99 },
    ];
    repo.findByProduct.mockResolvedValue(prices as never);

    const result = await productPriceService.listByProduct("p1");
    expect(result).toHaveLength(2);
    expect(repo.findByProduct).toHaveBeenCalledWith("p1");
  });
});

describe("productPriceService.getActivePrice", () => {
  it("returns active price for mode", async () => {
    repo.findActivePrice.mockResolvedValue({
      id: "pp1",
      stripePriceId: "price_test_1",
      isDefault: true,
    } as never);

    const result = await productPriceService.getActivePrice("p1", "test");
    expect(result).not.toBeNull();
    expect(result!.id).toBe("pp1");
  });

  it("returns null when no active price", async () => {
    repo.findActivePrice.mockResolvedValue(null as never);

    const result = await productPriceService.getActivePrice("p1", "test");
    expect(result).toBeNull();
  });
});

describe("productPriceService.create", () => {
  it("creates a product price with defaults", async () => {
    repo.create.mockResolvedValue({
      id: "pp_new",
      productId: "p1",
      label: "Launch Offer",
      stripePriceId: "price_test_launch",
      mode: "test",
      amount: 4.99,
      currency: "USD",
      interval: null,
      isDefault: false,
    } as never);

    const result = await productPriceService.create({
      productId: "p1",
      label: "Launch Offer",
      stripePriceId: "price_test_launch",
      mode: "test",
      amount: 4.99,
    });

    expect(result.id).toBe("pp_new");
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Launch Offer",
        amount: 4.99,
        currency: "USD",
        interval: null,
        isDefault: false,
      }),
    );
  });

  it("passes custom values through", async () => {
    repo.create.mockResolvedValue({ id: "pp_new" } as never);

    await productPriceService.create({
      productId: "p1",
      label: "Yearly Pro",
      stripePriceId: "price_test_pro_yearly",
      mode: "test",
      amount: 299.99,
      currency: "EUR",
      interval: "year",
      isDefault: true,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        currency: "EUR",
        interval: "year",
        isDefault: true,
      }),
    );
  });
});

describe("productPriceService.update", () => {
  it("updates only provided fields", async () => {
    repo.update.mockResolvedValue({ id: "pp1", amount: 19.99 } as never);

    await productPriceService.update("pp1", { amount: 19.99 });
    expect(repo.update).toHaveBeenCalledWith("pp1", { amount: 19.99 });
  });

  it("handles interval reset to null", async () => {
    repo.update.mockResolvedValue({ id: "pp1" } as never);

    await productPriceService.update("pp1", { interval: "" });
    expect(repo.update).toHaveBeenCalledWith("pp1", { interval: null });
  });
});

describe("productPriceService.delete", () => {
  it("deletes a price", async () => {
    repo.delete.mockResolvedValue(undefined as never);

    await productPriceService.delete("pp1");
    expect(repo.delete).toHaveBeenCalledWith("pp1");
  });
});
