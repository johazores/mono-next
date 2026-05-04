import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/user-repository", () => ({
  userRepository: {
    findById: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/repositories/purchase-repository", () => ({
  purchaseRepository: {
    findByExternalId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/repositories/product-repository", () => ({
  productRepository: {
    listAll: vi.fn(),
  },
}));

vi.mock("@/lib/payment", () => ({
  getPaymentProvider: vi.fn(),
  getPaymentConfig: vi.fn(),
}));

import { billingService } from "@/services/billing-service";
import { userRepository } from "@/repositories/user-repository";
import { purchaseRepository } from "@/repositories/purchase-repository";
import { productRepository } from "@/repositories/product-repository";
import { getPaymentProvider, getPaymentConfig } from "@/lib/payment";

const userRepo = vi.mocked(userRepository);
const purchaseRepo = vi.mocked(purchaseRepository);
const productRepo = vi.mocked(productRepository);
const mockGetProvider = vi.mocked(getPaymentProvider);
const mockGetConfig = vi.mocked(getPaymentConfig);

const mockProvider = {
  findOrCreateCustomer: vi.fn(),
  createBillingPortalSession: vi.fn(),
  getCustomerSubscriptions: vi.fn(),
  getCustomerInvoices: vi.fn(),
  createCheckoutSession: vi.fn(),
  verifySession: vi.fn(),
};

const testConfig = {
  provider: "stripe" as const,
  mode: "test" as const,
  publicKey: "pk_test_123",
  secretKey: "sk_test_123",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetProvider.mockReturnValue(mockProvider);
  mockGetConfig.mockResolvedValue(testConfig);
});

describe("billingService.ensureStripeCustomer", () => {
  it("returns existing customer ID if already set", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      email: "test@test.com",
      name: "Test",
      stripeCustomerId: "cus_existing",
    } as never);

    const result = await billingService.ensureStripeCustomer("u1");
    expect(result).toBe("cus_existing");
    expect(mockProvider.findOrCreateCustomer).not.toHaveBeenCalled();
  });

  it("creates customer via Stripe if not set", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      email: "test@test.com",
      name: "Test",
      stripeCustomerId: null,
    } as never);
    mockProvider.findOrCreateCustomer.mockResolvedValue("cus_new");
    userRepo.update.mockResolvedValue({} as never);

    const result = await billingService.ensureStripeCustomer("u1");
    expect(result).toBe("cus_new");
    expect(mockProvider.findOrCreateCustomer).toHaveBeenCalledWith(
      "test@test.com",
      "Test",
      testConfig,
    );
    expect(userRepo.update).toHaveBeenCalledWith("u1", {
      stripeCustomerId: "cus_new",
    });
  });

  it("throws if user not found", async () => {
    userRepo.findById.mockResolvedValue(null);
    await expect(billingService.ensureStripeCustomer("u1")).rejects.toThrow(
      "User not found.",
    );
  });
});

describe("billingService.getStatus", () => {
  it("returns empty status for user without Stripe customer", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      stripeCustomerId: null,
    } as never);

    const status = await billingService.getStatus("u1");
    expect(status.hasStripeCustomer).toBe(false);
    expect(status.subscriptions).toEqual([]);
    expect(status.invoices).toEqual([]);
  });

  it("fetches subscriptions and invoices for Stripe customer", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      stripeCustomerId: "cus_123",
    } as never);
    mockProvider.getCustomerSubscriptions.mockResolvedValue([
      { id: "sub_1", status: "active", currentPeriodEnd: 1700000000 },
    ]);
    mockProvider.getCustomerInvoices.mockResolvedValue([
      { id: "inv_1", status: "paid", amountPaid: 9.99 },
    ]);

    const status = await billingService.getStatus("u1");
    expect(status.hasStripeCustomer).toBe(true);
    expect(status.subscriptions).toHaveLength(1);
    expect(status.invoices).toHaveLength(1);
  });
});

describe("billingService.syncPurchases", () => {
  it("returns synced 0 for user without Stripe customer", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      stripeCustomerId: null,
    } as never);

    const result = await billingService.forceSyncPurchases("u1");
    expect(result.synced).toBe(0);
  });

  it("syncs subscriptions to local purchases", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      stripeCustomerId: "cus_123",
    } as never);

    mockProvider.getCustomerSubscriptions.mockResolvedValue([
      {
        id: "sub_1",
        status: "active",
        currentPeriodEnd: 1700000000,
        cancelAtPeriodEnd: false,
        interval: "month",
        items: [{ priceId: "price_test_1", productId: "prod_stripe_1" }],
      },
    ]);
    mockProvider.getCustomerInvoices.mockResolvedValue([]);
    productRepo.listAll.mockResolvedValue([
      {
        id: "p1",
        price: 9.99,
        currency: "USD",
        stripeTestProductId: "prod_stripe_1",
        stripeLiveProductId: null,
      },
    ] as never);
    purchaseRepo.findByExternalId.mockResolvedValue(null);
    purchaseRepo.create.mockResolvedValue({ id: "pur_1" } as never);

    const result = await billingService.forceSyncPurchases("u1");
    expect(result.synced).toBe(1);
    expect(purchaseRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: "sub_1",
        status: "active",
        amount: 9.99,
      }),
    );
  });

  it("updates existing purchase by externalId", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      stripeCustomerId: "cus_123",
    } as never);

    mockProvider.getCustomerSubscriptions.mockResolvedValue([
      {
        id: "sub_1",
        status: "canceled",
        currentPeriodEnd: 1700000000,
        cancelAtPeriodEnd: true,
        interval: "month",
        items: [{ priceId: "price_test_1", productId: "prod_stripe_1" }],
      },
    ]);
    mockProvider.getCustomerInvoices.mockResolvedValue([]);
    productRepo.listAll.mockResolvedValue([
      {
        id: "p1",
        price: 9.99,
        currency: "USD",
        stripeTestProductId: "prod_stripe_1",
        stripeLiveProductId: null,
      },
    ] as never);
    purchaseRepo.findByExternalId.mockResolvedValue({
      id: "pur_existing",
      endDate: null,
      cancelledAt: null,
    } as never);
    purchaseRepo.update.mockResolvedValue({} as never);

    const result = await billingService.forceSyncPurchases("u1");
    expect(result.synced).toBe(1);
    expect(purchaseRepo.update).toHaveBeenCalledWith(
      "pur_existing",
      expect.objectContaining({ status: "cancelled" }),
    );
  });

  it("skips invoices tied to synced subscriptions", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      stripeCustomerId: "cus_123",
    } as never);

    mockProvider.getCustomerSubscriptions.mockResolvedValue([
      {
        id: "sub_1",
        status: "active",
        currentPeriodEnd: 1700000000,
        cancelAtPeriodEnd: false,
        interval: "month",
        items: [{ priceId: "price_test_1", productId: "prod_stripe_1" }],
      },
    ]);
    mockProvider.getCustomerInvoices.mockResolvedValue([
      {
        id: "inv_1",
        status: "paid",
        amountPaid: 9.99,
        currency: "usd",
        subscriptionId: "sub_1",
        stripeProductId: "prod_stripe_1",
        stripePriceId: "price_test_1",
        periodStart: 1699000000,
        periodEnd: 1700000000,
        hostedUrl: null,
        pdfUrl: null,
        created: 1699000000,
      },
    ]);
    productRepo.listAll.mockResolvedValue([
      {
        id: "p1",
        price: 9.99,
        currency: "USD",
        stripeTestProductId: "prod_stripe_1",
        stripeLiveProductId: null,
      },
    ] as never);
    purchaseRepo.findByExternalId.mockResolvedValue(null);
    purchaseRepo.create.mockResolvedValue({ id: "pur_1" } as never);

    const result = await billingService.forceSyncPurchases("u1");
    // Should only sync the subscription, not the invoice (since it belongs to the sub)
    expect(result.synced).toBe(1);
    expect(purchaseRepo.create).toHaveBeenCalledTimes(1);
    expect(purchaseRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: "sub_1" }),
    );
  });

  it("syncs standalone invoices not tied to subscriptions", async () => {
    userRepo.findById.mockResolvedValue({
      id: "u1",
      stripeCustomerId: "cus_123",
    } as never);

    mockProvider.getCustomerSubscriptions.mockResolvedValue([]);
    mockProvider.getCustomerInvoices.mockResolvedValue([
      {
        id: "inv_standalone",
        status: "paid",
        amountPaid: 49.99,
        currency: "usd",
        subscriptionId: null,
        stripeProductId: "prod_stripe_2",
        stripePriceId: null,
        periodStart: 1699000000,
        periodEnd: 1699000000,
        hostedUrl: "https://invoice.stripe.com/i/123",
        pdfUrl: "https://invoice.stripe.com/pdf/123",
        created: 1699000000,
      },
    ]);
    productRepo.listAll.mockResolvedValue([
      {
        id: "p2",
        price: 49.99,
        currency: "USD",
        stripeTestProductId: "prod_stripe_2",
        stripeLiveProductId: null,
      },
    ] as never);
    purchaseRepo.findByExternalId.mockResolvedValue(null);
    purchaseRepo.create.mockResolvedValue({ id: "pur_2" } as never);

    const result = await billingService.forceSyncPurchases("u1");
    expect(result.synced).toBe(1);
    expect(purchaseRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        externalId: "inv_standalone",
        amount: 49.99,
        status: "completed",
      }),
    );
  });
});

describe("billingService.syncInBackground", () => {
  it("swallows errors silently", () => {
    userRepo.findById.mockRejectedValue(new Error("DB down"));
    // Should not throw
    expect(() => billingService.syncInBackground("u1")).not.toThrow();
  });
});
