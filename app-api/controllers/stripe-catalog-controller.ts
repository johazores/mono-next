import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { stripeCatalogService } from "@/services/stripe-catalog-service";

/* ------------------------------------------------------------------ */
/* GET /api/stripe/products — list all active Stripe products          */
/* ------------------------------------------------------------------ */

export async function stripeProductsController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return sendError(res, "Method not allowed.", 405);
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  try {
    const result = await stripeCatalogService.listProducts();
    return sendOk(res, result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch products.";
    const isConfig = message.includes("not configured");
    return sendError(res, message, isConfig ? 400 : 502);
  }
}

/* ------------------------------------------------------------------ */
/* GET /api/stripe/products/[productId] — product + its prices         */
/* ------------------------------------------------------------------ */

export async function stripeProductDetailController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return sendError(res, "Method not allowed.", 405);
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const productId = req.query.productId as string;
  if (!productId || !productId.startsWith("prod_")) {
    return sendError(res, "Invalid Stripe product ID.", 400);
  }

  try {
    const result = await stripeCatalogService.getProduct(productId);
    return sendOk(res, result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch product.";
    const isConfig = message.includes("not configured");
    return sendError(res, message, isConfig ? 400 : 502);
  }
}

/* ------------------------------------------------------------------ */
/* GET /api/stripe/prices/[priceId] — single price lookup              */
/* ------------------------------------------------------------------ */

export async function stripePriceLookupController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return sendError(res, "Method not allowed.", 405);
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const priceId = req.query.priceId as string;
  if (!priceId || !priceId.startsWith("price_")) {
    return sendError(res, "Invalid Stripe price ID.", 400);
  }

  try {
    const price = await stripeCatalogService.getPrice(priceId);
    return sendOk(res, price);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch price.";
    const isConfig = message.includes("not configured");
    return sendError(res, message, isConfig ? 400 : 502);
  }
}
