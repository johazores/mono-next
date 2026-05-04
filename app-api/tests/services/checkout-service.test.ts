import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/checkout-repository", () => ({
  checkoutRepository: {
    create: vi.fn(),
    findBySessionId: vi.fn(),
    updateStatus: vi.fn(),
  },
}));

vi.mock("@/repositories/product-repository", () => ({
  productRepository: {
    findById: vi.fn(),
  },
}));

vi.mock("@/repositories/product-price-repository", () => ({
  productPriceRepository: {
    findActivePrice: vi.fn(),
  },
}));

vi.mock("@/repositories/user-repository", () => ({
  userRepository: {
    findById: vi.fn(),
    findByEmailWithPassword: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/services/purchase-service", () => ({
  purchaseService: {
    create: vi.fn(),
  },
}));

vi.mock("@/lib/payment", () => ({
  getPaymentProvider: vi.fn(),
  getPaymentConfig: vi.fn(),
}));

vi.mock("@/lib/password", () => ({
  hashPassword: vi.fn(() => "hashed-password"),
}));

import { checkoutService } from "@/services/checkout-service";
import { checkoutRepository } from "@/repositories/checkout-repository";
import { productRepository } from "@/repositories/product-repository";
import { productPriceRepository } from "@/repositories/product-price-repository";
import { userRepository } from "@/repositories/user-repository";
import { purchaseService } from "@/services/purchase-service";
import { getPaymentProvider, getPaymentConfig } from "@/lib/payment";

const checkoutRepo = vi.mocked(checkoutRepository);
const productRepo = vi.mocked(productRepository);
const priceRepo = vi.mocked(productPriceRepository);
const userRepo = vi.mocked(userRepository);
const purchaseSvc = vi.mocked(purchaseService);
const mockGetProvider = vi.mocked(getPaymentProvider);
const mockGetConfig = vi.mocked(getPaymentConfig);

const now = new Date();

function fakeProduct(overrides = {}) {
  return {
    id: "prod-1",
    name: "Starter",
    slug: "starter",
    description: "Starter plan",
    type: "membership",
    price: 9.99,
    currency: "USD",
    paymentModel: "recurring",
    maxSubUsers: 3,
    accessKeys: ["storage.5gb"],
    stripeTestProductId: "prod_test_123",
    stripeLiveProductId: "prod_live_123",
    isActive: true,
    sortOrder: 1,
    metadata: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function fakeConfig() {
  return {
    provider: "stripe" as const,
    mode: "test" as const,
    publicKey: "pk_test_123",
    secretKey: "sk_test_123",
  };
}

const mockProvider = {
  createCheckoutSession: vi.fn(),
  verifySession: vi.fn(),
  findOrCreateCustomer: vi.fn(),
  createBillingPortalSession: vi.fn(),
  getCustomerSubscriptions: vi.fn(),
  getCustomerInvoices: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetProvider.mockReturnValue(mockProvider);
  mockGetConfig.mockResolvedValue(fakeConfig());
  // Default: ProductPrice record returns an active price
  priceRepo.findActivePrice.mockResolvedValue({
    id: "pp-1",
    productId: "prod-1",
    stripePriceId: "price_test_123",
    mode: "test",
    amount: 9.99,
  } as never);
  // Default: authenticated user lookup
  userRepo.findById.mockResolvedValue({
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    stripeCustomerId: null,
  } as never);
  mockProvider.findOrCreateCustomer.mockResolvedValue("cus_test_123");
  userRepo.update.mockResolvedValue({} as never);
});

describe("checkoutService.createSession", () => {
  it("creates a checkout session for an authenticated user", async () => {
    const product = fakeProduct();
    productRepo.findById.mockResolvedValue(product as never);
    mockProvider.createCheckoutSession.mockResolvedValue({
      sessionId: "cs_test_abc",
      redirectUrl: "https://checkout.stripe.com/pay/cs_test_abc",
    });
    checkoutRepo.create.mockResolvedValue({} as never);

    const result = await checkoutService.createSession(
      {
        items: [{ productId: "prod-1", quantity: 1 }],
        successUrl: "http://localhost/success",
        cancelUrl: "http://localhost/cancel",
      },
      "user-1",
    );

    expect(result.redirectUrl).toBe(
      "https://checkout.stripe.com/pay/cs_test_abc",
    );
    expect(result.sessionId).toBe("cs_test_abc");
    expect(mockProvider.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        lineItems: [
          { priceId: "price_test_123", quantity: 1, productId: "prod-1" },
        ],
      }),
      fakeConfig(),
    );
    expect(checkoutRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "cs_test_abc",
        userId: "user-1",
      }),
    );
  });

  it("creates a session for guest checkout without pre-collected email", async () => {
    const product = fakeProduct({ paymentModel: "one-time" });
    productRepo.findById.mockResolvedValue(product as never);
    mockProvider.createCheckoutSession.mockResolvedValue({
      sessionId: "cs_test_guest",
      redirectUrl: "https://checkout.stripe.com/pay/cs_test_guest",
    });
    checkoutRepo.create.mockResolvedValue({} as never);

    const result = await checkoutService.createSession({
      items: [{ productId: "prod-1", quantity: 1 }],
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
    });

    expect(result.sessionId).toBe("cs_test_guest");
    // Should NOT set customerEmail since none was provided (Stripe collects it)
    expect(mockProvider.createCheckoutSession).toHaveBeenCalledWith(
      expect.not.objectContaining({
        customerEmail: expect.anything(),
      }),
      fakeConfig(),
    );
  });

  it("throws when cart is empty", async () => {
    await expect(
      checkoutService.createSession({
        items: [],
        successUrl: "http://localhost/success",
        cancelUrl: "http://localhost/cancel",
      }),
    ).rejects.toThrow("Cart is empty.");
  });

  it("throws when product is not found", async () => {
    productRepo.findById.mockResolvedValue(null);

    await expect(
      checkoutService.createSession({
        items: [{ productId: "nonexistent", quantity: 1 }],
        successUrl: "http://localhost/success",
        cancelUrl: "http://localhost/cancel",
      }),
    ).rejects.toThrow("Product not found");
  });

  it("throws when product is inactive", async () => {
    productRepo.findById.mockResolvedValue(
      fakeProduct({ isActive: false }) as never,
    );

    await expect(
      checkoutService.createSession({
        items: [{ productId: "prod-1", quantity: 1 }],
        successUrl: "http://localhost/success",
        cancelUrl: "http://localhost/cancel",
      }),
    ).rejects.toThrow("no longer available");
  });

  it("throws when no active price is configured", async () => {
    productRepo.findById.mockResolvedValue(fakeProduct() as never);
    priceRepo.findActivePrice.mockResolvedValue(null);

    await expect(
      checkoutService.createSession({
        items: [{ productId: "prod-1", quantity: 1 }],
        successUrl: "http://localhost/success",
        cancelUrl: "http://localhost/cancel",
      }),
    ).rejects.toThrow("no active Stripe test price configured");
  });

  it("throws when payment is not configured", async () => {
    mockGetConfig.mockResolvedValue({ ...fakeConfig(), secretKey: "" });

    await expect(
      checkoutService.createSession({
        items: [{ productId: "prod-1", quantity: 1 }],
        successUrl: "http://localhost/success",
        cancelUrl: "http://localhost/cancel",
      }),
    ).rejects.toThrow("Payment is not configured");
  });

  it("uses live price ID when mode is live", async () => {
    mockGetConfig.mockResolvedValue({ ...fakeConfig(), mode: "live" });
    const product = fakeProduct();
    productRepo.findById.mockResolvedValue(product as never);
    priceRepo.findActivePrice.mockResolvedValue({
      id: "pp-live",
      productId: "prod-1",
      stripePriceId: "price_live_123",
      mode: "live",
      amount: 9.99,
    } as never);
    mockProvider.createCheckoutSession.mockResolvedValue({
      sessionId: "cs_live",
      redirectUrl: "https://checkout.stripe.com/pay/cs_live",
    });
    checkoutRepo.create.mockResolvedValue({} as never);

    await checkoutService.createSession(
      {
        items: [{ productId: "prod-1", quantity: 1 }],
        successUrl: "http://localhost/success",
        cancelUrl: "http://localhost/cancel",
      },
      "user-1",
    );

    expect(mockProvider.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        lineItems: [
          { priceId: "price_live_123", quantity: 1, productId: "prod-1" },
        ],
      }),
      expect.objectContaining({ mode: "live" }),
    );
  });

  it("uses ProductPrice record when available", async () => {
    const product = fakeProduct();
    productRepo.findById.mockResolvedValue(product as never);

    // ProductPrice table returns an active price
    priceRepo.findActivePrice.mockResolvedValue({
      id: "pp-1",
      productId: "prod-1",
      stripePriceId: "price_from_table",
      mode: "test",
      amount: 14.99,
    } as never);

    mockProvider.createCheckoutSession.mockResolvedValue({
      sessionId: "cs_pp",
      redirectUrl: "https://checkout.stripe.com/pay/cs_pp",
    });
    checkoutRepo.create.mockResolvedValue({} as never);

    await checkoutService.createSession(
      {
        items: [{ productId: "prod-1", quantity: 1 }],
        successUrl: "http://localhost/success",
        cancelUrl: "http://localhost/cancel",
      },
      "user-1",
    );

    // Should use the price from the table, not the legacy field
    expect(mockProvider.createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        lineItems: [
          { priceId: "price_from_table", quantity: 1, productId: "prod-1" },
        ],
      }),
      expect.anything(),
    );
  });
});

describe("checkoutService.verifySession", () => {
  it("verifies a paid session and creates purchases", async () => {
    checkoutRepo.findBySessionId.mockResolvedValue({
      id: "checkout-1",
      sessionId: "cs_test_abc",
      userId: "user-1",
      guestEmail: null,
      guestName: null,
      items: [{ productId: "prod-1", quantity: 1 }],
      status: "pending",
      provider: "stripe",
      metadata: null,
      createdAt: now,
      updatedAt: now,
    } as never);

    mockProvider.verifySession.mockResolvedValue({
      sessionId: "cs_test_abc",
      paymentStatus: "paid",
      customerId: "cus_test_123",
      customerEmail: null,
      customerName: null,
      metadata: {},
      lineItems: [{ priceId: "price_test_123", quantity: 1 }],
    });

    purchaseSvc.create.mockResolvedValue({
      id: "purchase-1",
      userId: "user-1",
      productId: "prod-1",
      status: "active",
      amount: 9.99,
      currency: "USD",
      product: { name: "Starter" },
    } as never);

    const result = await checkoutService.verifySession("cs_test_abc");

    expect(result.purchases).toHaveLength(1);
    expect(result.purchases[0].amount).toBe(9.99);
    expect(result.user).toBeUndefined();
    expect(checkoutRepo.updateStatus).toHaveBeenCalledWith(
      "checkout-1",
      "completed",
    );
  });

  it("creates a user for guest checkout using Stripe-sourced email and name", async () => {
    checkoutRepo.findBySessionId.mockResolvedValue({
      id: "checkout-2",
      sessionId: "cs_test_guest",
      userId: null,
      guestEmail: null,
      guestName: null,
      items: [{ productId: "prod-1", quantity: 1 }],
      status: "pending",
      provider: "stripe",
      metadata: null,
      createdAt: now,
      updatedAt: now,
    } as never);

    mockProvider.verifySession.mockResolvedValue({
      sessionId: "cs_test_guest",
      paymentStatus: "paid",
      customerId: "cus_guest_123",
      customerEmail: "guest@example.com",
      customerName: "Guest User",
      metadata: {},
      lineItems: [],
    });

    userRepo.findByEmailWithPassword.mockResolvedValue(null);
    userRepo.create.mockResolvedValue({
      id: "new-user-1",
      email: "guest@example.com",
      name: "Guest User",
    } as never);

    purchaseSvc.create.mockResolvedValue({
      id: "purchase-2",
      userId: "new-user-1",
      productId: "prod-1",
      status: "active",
      amount: 9.99,
      product: { name: "Starter" },
    } as never);

    const result = await checkoutService.verifySession("cs_test_guest");

    expect(result.user).toEqual({
      id: "new-user-1",
      email: "guest@example.com",
      name: "Guest User",
    });
    expect(userRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "guest@example.com",
        name: "Guest User",
        status: "active",
      }),
    );
  });

  it("links to existing user when guest email matches", async () => {
    checkoutRepo.findBySessionId.mockResolvedValue({
      id: "checkout-3",
      sessionId: "cs_test_existing",
      userId: null,
      guestEmail: null,
      guestName: null,
      items: [{ productId: "prod-1", quantity: 1 }],
      status: "pending",
      provider: "stripe",
      metadata: null,
      createdAt: now,
      updatedAt: now,
    } as never);

    mockProvider.verifySession.mockResolvedValue({
      sessionId: "cs_test_existing",
      paymentStatus: "paid",
      customerId: "cus_existing_123",
      customerEmail: "existing@example.com",
      customerName: null,
      metadata: {},
      lineItems: [],
    });

    userRepo.findByEmailWithPassword.mockResolvedValue({
      id: "existing-user",
      email: "existing@example.com",
    } as never);

    purchaseSvc.create.mockResolvedValue({
      id: "purchase-3",
      userId: "existing-user",
      productId: "prod-1",
      status: "active",
      amount: 9.99,
      product: { name: "Starter" },
    } as never);

    const result = await checkoutService.verifySession("cs_test_existing");

    expect(result.user).toBeUndefined();
    expect(userRepo.create).not.toHaveBeenCalled();
    expect(purchaseSvc.create).toHaveBeenCalledWith(
      "existing-user",
      "prod-1",
      expect.anything(),
    );
  });

  it("throws when session not found", async () => {
    checkoutRepo.findBySessionId.mockResolvedValue(null);

    await expect(
      checkoutService.verifySession("cs_nonexistent"),
    ).rejects.toThrow("Checkout session not found.");
  });

  it("throws when session already completed", async () => {
    checkoutRepo.findBySessionId.mockResolvedValue({
      id: "checkout-done",
      sessionId: "cs_done",
      status: "completed",
    } as never);

    await expect(checkoutService.verifySession("cs_done")).rejects.toThrow(
      "already been processed",
    );
  });

  it("throws when payment is not paid", async () => {
    checkoutRepo.findBySessionId.mockResolvedValue({
      id: "checkout-unpaid",
      sessionId: "cs_unpaid",
      userId: "user-1",
      status: "pending",
      items: [],
    } as never);

    mockProvider.verifySession.mockResolvedValue({
      sessionId: "cs_unpaid",
      paymentStatus: "unpaid",
      customerId: null,
      customerEmail: null,
      customerName: null,
      metadata: {},
      lineItems: [],
    });

    await expect(checkoutService.verifySession("cs_unpaid")).rejects.toThrow(
      "Payment has not been completed",
    );
  });
});
