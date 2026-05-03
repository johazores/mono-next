import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { stripeProvider } from "@/lib/payment/stripe-provider";

const config = {
  provider: "stripe" as const,
  mode: "test" as const,
  publicKey: "pk_test_123",
  secretKey: "sk_test_123",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("stripeProvider.createCheckoutSession", () => {
  it("sends correct request to Stripe API", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "cs_test_abc",
        url: "https://checkout.stripe.com/pay/cs_test_abc",
      }),
    });

    const result = await stripeProvider.createCheckoutSession(
      {
        mode: "payment",
        lineItems: [
          { priceId: "price_test_123", quantity: 2, productId: "prod-1" },
        ],
        successUrl: "http://localhost/success?session_id={CHECKOUT_SESSION_ID}",
        cancelUrl: "http://localhost/cancel",
        customerEmail: "test@example.com",
        metadata: { userId: "user-1" },
      },
      config,
    );

    expect(result.sessionId).toBe("cs_test_abc");
    expect(result.redirectUrl).toBe(
      "https://checkout.stripe.com/pay/cs_test_abc",
    );

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/checkout/sessions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test_123",
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      }),
    );

    const body = mockFetch.mock.calls[0][1].body;
    expect(body).toContain("mode=payment");
    expect(body).toContain("customer_email=test%40example.com");
    expect(body).toContain("line_items%5B0%5D%5Bprice%5D=price_test_123");
    expect(body).toContain("line_items%5B0%5D%5Bquantity%5D=2");
  });

  it("throws on Stripe API error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        error: { message: "Invalid API Key" },
      }),
    });

    await expect(
      stripeProvider.createCheckoutSession(
        {
          mode: "payment",
          lineItems: [],
          successUrl: "http://localhost/success",
          cancelUrl: "http://localhost/cancel",
        },
        config,
      ),
    ).rejects.toThrow("Invalid API Key");
  });
});

describe("stripeProvider.verifySession", () => {
  it("returns verified session data", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "cs_test_abc",
          payment_status: "paid",
          customer: "cus_test_456",
          customer_details: {
            email: "buyer@example.com",
            name: "Buyer Name",
          },
          metadata: { userId: "user-1" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ price: { id: "price_test_123" }, quantity: 1 }],
        }),
      });

    const result = await stripeProvider.verifySession("cs_test_abc", config);

    expect(result.sessionId).toBe("cs_test_abc");
    expect(result.paymentStatus).toBe("paid");
    expect(result.customerId).toBe("cus_test_456");
    expect(result.customerEmail).toBe("buyer@example.com");
    expect(result.customerName).toBe("Buyer Name");
    expect(result.lineItems).toEqual([
      { priceId: "price_test_123", quantity: 1 },
    ]);

    // First call: get session, second call: get line items
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[0][0]).toBe(
      "https://api.stripe.com/v1/checkout/sessions/cs_test_abc",
    );
    expect(mockFetch.mock.calls[1][0]).toBe(
      "https://api.stripe.com/v1/checkout/sessions/cs_test_abc/line_items",
    );
  });
});
