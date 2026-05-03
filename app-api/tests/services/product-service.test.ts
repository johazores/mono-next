import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/product-repository", () => ({
  productRepository: {
    list: vi.fn(),
    listAll: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    countActivePurchases: vi.fn(),
  },
}));

import { productService } from "@/services/product-service";
import { productRepository } from "@/repositories/product-repository";

const repo = vi.mocked(productRepository);

const now = new Date();

function fakeProduct(overrides = {}) {
  return {
    id: "prod-1",
    name: "Test Product",
    slug: "test-product",
    description: null,
    type: "digital",
    price: 49.99,
    currency: "USD",
    paymentModel: "one-time",
    fileUrls: [],
    accessKeys: [],
    isActive: true,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("productService.create", () => {
  it("creates a product with valid input", async () => {
    const product = fakeProduct();
    repo.findBySlug.mockResolvedValue(null as never);
    repo.create.mockResolvedValue(product as never);

    const result = await productService.create({
      name: "Test Product",
      slug: "test-product",
      price: 49.99,
    });

    expect(repo.create).toHaveBeenCalledOnce();
    expect(result).toEqual(product);
  });

  it("rejects name shorter than 2 characters", async () => {
    await expect(
      productService.create({ name: "A", slug: "a-product", price: 10 }),
    ).rejects.toThrow("Name must be between 2 and 100 characters.");
  });

  it("rejects empty name", async () => {
    await expect(
      productService.create({ name: "", slug: "test", price: 10 }),
    ).rejects.toThrow("Name must be between 2 and 100 characters.");
  });

  it("rejects invalid slug", async () => {
    await expect(
      productService.create({
        name: "Test Product",
        slug: "INVALID SLUG!",
        price: 10,
      }),
    ).rejects.toThrow("Slug must be lowercase alphanumeric with hyphens only.");
  });

  it("rejects duplicate slug", async () => {
    repo.findBySlug.mockResolvedValue(fakeProduct() as never);

    await expect(
      productService.create({
        name: "Test Product",
        slug: "test-product",
        price: 10,
      }),
    ).rejects.toThrow("A product with this slug already exists.");
  });

  it("rejects negative price", async () => {
    repo.findBySlug.mockResolvedValue(null as never);

    await expect(
      productService.create({
        name: "Test Product",
        slug: "test-product",
        price: -5,
      }),
    ).rejects.toThrow("Price must be zero or positive.");
  });

  it("defaults currency to USD", async () => {
    const product = fakeProduct();
    repo.findBySlug.mockResolvedValue(null as never);
    repo.create.mockResolvedValue(product as never);

    await productService.create({
      name: "Test Product",
      slug: "test-product",
      price: 10,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ currency: "USD" }),
    );
  });
});

describe("productService.update", () => {
  it("updates a product with valid input", async () => {
    const existing = fakeProduct();
    const updated = fakeProduct({ name: "Updated Name" });
    repo.findById.mockResolvedValue(existing as never);
    repo.update.mockResolvedValue(updated as never);

    const result = await productService.update("prod-1", {
      name: "Updated Name",
    });

    expect(repo.update).toHaveBeenCalledWith(
      "prod-1",
      expect.objectContaining({ name: "Updated Name" }),
    );
    expect(result).toEqual(updated);
  });

  it("throws on non-existent product", async () => {
    repo.findById.mockResolvedValue(null as never);

    await expect(
      productService.update("nonexistent", { name: "Test" }),
    ).rejects.toThrow("Product not found.");
  });

  it("rejects invalid slug on update", async () => {
    repo.findById.mockResolvedValue(fakeProduct() as never);

    await expect(
      productService.update("prod-1", { slug: "BAD SLUG!" }),
    ).rejects.toThrow("Slug must be lowercase alphanumeric with hyphens only.");
  });

  it("checks slug uniqueness on rename", async () => {
    repo.findById.mockResolvedValue(fakeProduct() as never);
    repo.findBySlug.mockResolvedValue(
      fakeProduct({ slug: "other-product" }) as never,
    );

    await expect(
      productService.update("prod-1", { slug: "other-product" }),
    ).rejects.toThrow("A product with this slug already exists.");
  });

  it("allows keeping the same slug", async () => {
    const existing = fakeProduct();
    repo.findById.mockResolvedValue(existing as never);
    repo.update.mockResolvedValue(existing as never);

    await productService.update("prod-1", { slug: "test-product" });

    expect(repo.findBySlug).not.toHaveBeenCalled();
  });

  it("rejects negative price", async () => {
    repo.findById.mockResolvedValue(fakeProduct() as never);

    await expect(
      productService.update("prod-1", { price: -1 }),
    ).rejects.toThrow("Price must be zero or positive.");
  });

  it("rejects invalid product type", async () => {
    repo.findById.mockResolvedValue(fakeProduct() as never);

    await expect(
      productService.update("prod-1", { type: "invalid" as never }),
    ).rejects.toThrow("Invalid product type.");
  });

  it("rejects invalid payment model", async () => {
    repo.findById.mockResolvedValue(fakeProduct() as never);

    await expect(
      productService.update("prod-1", { paymentModel: "invalid" as never }),
    ).rejects.toThrow("Invalid payment model.");
  });

  it("throws when no fields to update", async () => {
    repo.findById.mockResolvedValue(fakeProduct() as never);

    await expect(productService.update("prod-1", {})).rejects.toThrow(
      "No fields to update.",
    );
  });
});

describe("productService.deactivate", () => {
  it("deactivates an existing product", async () => {
    const product = fakeProduct();
    const deactivated = fakeProduct({ isActive: false });
    repo.findById.mockResolvedValue(product as never);
    repo.countActivePurchases.mockResolvedValue(0 as never);
    repo.update.mockResolvedValue(deactivated as never);

    const result = await productService.deactivate("prod-1");

    expect(repo.update).toHaveBeenCalledWith("prod-1", { isActive: false });
    expect(result).toEqual(deactivated);
  });

  it("throws on non-existent product", async () => {
    repo.findById.mockResolvedValue(null as never);

    await expect(productService.deactivate("nonexistent")).rejects.toThrow(
      "Product not found.",
    );
  });
});
