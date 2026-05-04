import { getPaymentConfig } from "@/lib/payment";
import type {
  StripeProductListResult,
  StripeProductDetailResult,
  StripePriceLookup,
} from "@/types";

const STRIPE_API = "https://api.stripe.com/v1";

/* ------------------------------------------------------------------ */
/* Internal Stripe API response shapes (not domain types)              */
/* ------------------------------------------------------------------ */

type StripeProductResponse = {
  id: string;
  name: string;
  description: string | null;
  images: string[];
  active: boolean;
  metadata: Record<string, unknown>;
};

type StripePriceResponse = {
  id: string;
  unit_amount: number | null;
  currency: string;
  recurring: { interval: string } | null;
  nickname: string | null;
  type: string;
  active: boolean;
  product: string;
};

type StripeList<T> = { data: T[] };

async function stripeGet<T>(path: string, secretKey: string): Promise<T> {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const json = await res.json();

  if (!res.ok) {
    const msg = json?.error?.message ?? `Stripe API error: ${res.status}`;
    throw new Error(msg);
  }

  return json as T;
}

/* ------------------------------------------------------------------ */
/* Service methods                                                     */
/* ------------------------------------------------------------------ */

async function requireConfig() {
  const config = await getPaymentConfig();
  if (!config.secretKey) {
    throw new Error(
      "Payment is not configured. Set the Stripe secret key in Settings.",
    );
  }
  return config;
}

async function listProducts(): Promise<StripeProductListResult> {
  const config = await requireConfig();
  const data = await stripeGet<StripeList<StripeProductResponse>>(
    "/products?active=true&limit=100",
    config.secretKey,
  );

  const items = (data.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    images: p.images ?? [],
    active: p.active,
    metadata: p.metadata ?? {},
  }));

  return { items, mode: config.mode };
}

async function getProduct(
  productId: string,
): Promise<StripeProductDetailResult> {
  const config = await requireConfig();

  const [productData, pricesData] = await Promise.all([
    stripeGet<StripeProductResponse>(
      `/products/${encodeURIComponent(productId)}`,
      config.secretKey,
    ),
    stripeGet<StripeList<StripePriceResponse>>(
      `/prices?product=${encodeURIComponent(productId)}&active=true&limit=100`,
      config.secretKey,
    ),
  ]);

  const product = {
    id: productData.id,
    name: productData.name,
    description: productData.description ?? null,
    images: productData.images ?? [],
    active: productData.active,
    metadata: productData.metadata ?? {},
  };

  const prices = (pricesData.data ?? []).map((p) => ({
    id: p.id,
    amount: typeof p.unit_amount === "number" ? p.unit_amount / 100 : 0,
    currency: (p.currency ?? "usd").toUpperCase(),
    interval: p.recurring?.interval ?? null,
    nickname: p.nickname ?? null,
    type: p.type,
    active: p.active,
  }));

  return { product, prices, mode: config.mode };
}

async function getPrice(priceId: string): Promise<StripePriceLookup> {
  const config = await requireConfig();

  const data = await stripeGet<StripePriceResponse>(
    `/prices/${encodeURIComponent(priceId)}`,
    config.secretKey,
  );

  return {
    stripePriceId: data.id,
    stripeProductId: data.product,
    amount: typeof data.unit_amount === "number" ? data.unit_amount / 100 : 0,
    currency: (data.currency ?? "usd").toUpperCase(),
    interval: data.recurring?.interval ?? null,
    label: data.nickname ?? "",
    mode: config.mode,
    active: data.active,
  };
}

export const stripeCatalogService = { listProducts, getProduct, getPrice };
