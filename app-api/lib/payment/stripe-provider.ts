import type { PaymentConfig } from "@/types";
import type {
  PaymentProviderInterface,
  CreateSessionInput,
  CreateSessionResult,
  VerifiedSession,
  BillingPortalResult,
  StripeSubscription,
  StripeInvoice,
  StripeSession,
  StripeLineItem,
} from "./types";

const STRIPE_API = "https://api.stripe.com/v1";

function encodeForm(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
}

async function stripeRequest<T>(
  path: string,
  secretKey: string,
  body?: Record<string, string>,
): Promise<T> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secretKey}`,
  };

  const options: RequestInit = { method: body ? "POST" : "GET", headers };
  if (body) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    options.body = encodeForm(body);
  }

  const res = await fetch(`${STRIPE_API}${path}`, options);
  const json = await res.json();

  if (!res.ok) {
    const msg = json?.error?.message ?? `Stripe API error: ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

export const stripeProvider: PaymentProviderInterface = {
  async createCheckoutSession(
    input: CreateSessionInput,
    config: PaymentConfig,
  ): Promise<CreateSessionResult> {
    const body: Record<string, string> = {
      mode: input.mode,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    };

    // Add line items
    input.lineItems.forEach((item, i) => {
      body[`line_items[${i}][price]`] = item.priceId;
      body[`line_items[${i}][quantity]`] = String(item.quantity);
    });

    // Customer: use existing Stripe customer or email for guest
    if (input.customerId) {
      body.customer = input.customerId;
    } else if (input.customerEmail) {
      body.customer_email = input.customerEmail;
    }

    // Pass internal metadata
    if (input.metadata) {
      for (const [key, value] of Object.entries(input.metadata)) {
        body[`metadata[${key}]`] = value;
      }
    }

    const session = await stripeRequest<StripeSession>(
      "/checkout/sessions",
      config.secretKey,
      body,
    );

    return {
      sessionId: session.id,
      redirectUrl: session.url,
    };
  },

  async verifySession(
    sessionId: string,
    config: PaymentConfig,
  ): Promise<VerifiedSession> {
    const session = await stripeRequest<StripeSession>(
      `/checkout/sessions/${encodeURIComponent(sessionId)}`,
      config.secretKey,
    );

    // Fetch line items
    const items = await stripeRequest<StripeLineItem>(
      `/checkout/sessions/${encodeURIComponent(sessionId)}/line_items`,
      config.secretKey,
    );

    return {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      customerId: session.customer ?? null,
      customerEmail:
        session.customer_details?.email ?? session.customer_email ?? null,
      customerName: session.customer_details?.name ?? null,
      subscriptionId: session.subscription ?? null,
      paymentIntentId: session.payment_intent ?? null,
      metadata: session.metadata ?? {},
      lineItems: (items.data ?? []).map((li) => ({
        priceId: li.price.id,
        quantity: li.quantity,
      })),
    };
  },

  async findOrCreateCustomer(
    email: string,
    name: string | undefined,
    config: PaymentConfig,
  ): Promise<string> {
    // Search for existing customer by email
    const search = await stripeRequest<{ data: { id: string }[] }>(
      `/customers?email=${encodeURIComponent(email)}&limit=1`,
      config.secretKey,
    );

    if (search.data.length > 0) {
      return search.data[0].id;
    }

    // Create new customer
    const body: Record<string, string> = { email };
    if (name) body.name = name;

    const customer = await stripeRequest<{ id: string }>(
      "/customers",
      config.secretKey,
      body,
    );

    return customer.id;
  },

  async createBillingPortalSession(
    customerId: string,
    returnUrl: string,
    config: PaymentConfig,
  ): Promise<BillingPortalResult> {
    const session = await stripeRequest<{ url: string }>(
      "/billing_portal/sessions",
      config.secretKey,
      { customer: customerId, return_url: returnUrl },
    );

    return { url: session.url };
  },

  async getCustomerSubscriptions(
    customerId: string,
    config: PaymentConfig,
  ): Promise<StripeSubscription[]> {
    const result = await stripeRequest<{
      data: {
        id: string;
        status: string;
        current_period_end: number;
        cancel_at_period_end: boolean;
        items: {
          data: {
            price: {
              id: string;
              product: string;
              recurring: { interval: string } | null;
            };
          }[];
        };
      }[];
    }>(
      `/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=10`,
      config.secretKey,
    );

    return result.data.map((sub) => {
      // Derive interval from the first item's price (Stripe is the source of truth)
      const firstItem = sub.items.data[0];
      const interval = firstItem?.price?.recurring?.interval ?? null;

      return {
        id: sub.id,
        status: sub.status,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        interval,
        items: sub.items.data.map((item) => ({
          priceId: item.price.id,
          productId: item.price.product,
        })),
      };
    });
  },

  async getCustomerInvoices(
    customerId: string,
    config: PaymentConfig,
  ): Promise<StripeInvoice[]> {
    const result = await stripeRequest<{
      data: {
        id: string;
        status: string;
        amount_paid: number;
        currency: string;
        subscription: string | null;
        payment_intent: string | null;
        lines: {
          data: {
            price: { id: string; product: string } | null;
          }[];
        };
        period_start: number;
        period_end: number;
        hosted_invoice_url: string | null;
        invoice_pdf: string | null;
        created: number;
      }[];
    }>(
      `/invoices?customer=${encodeURIComponent(customerId)}&limit=50&expand[]=data.lines`,
      config.secretKey,
    );

    return result.data.map((inv) => {
      const firstLine = inv.lines?.data?.[0];
      return {
        id: inv.id,
        status: inv.status,
        amountPaid: inv.amount_paid / 100,
        currency: inv.currency.toUpperCase(),
        subscriptionId: inv.subscription ?? null,
        paymentIntentId:
          typeof inv.payment_intent === "string" ? inv.payment_intent : null,
        stripeProductId:
          typeof firstLine?.price?.product === "string"
            ? firstLine.price.product
            : null,
        stripePriceId: firstLine?.price?.id ?? null,
        periodStart: inv.period_start,
        periodEnd: inv.period_end,
        hostedUrl: inv.hosted_invoice_url ?? null,
        pdfUrl: inv.invoice_pdf ?? null,
        created: inv.created,
      };
    });
  },
};
