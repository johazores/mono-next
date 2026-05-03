import type { NextApiRequest, NextApiResponse } from "next";
import { requireUser } from "@/lib/user-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { purchaseService } from "@/services/purchase-service";
import { productService } from "@/services/product-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function purchaseCollectionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireUser(req, res);
  if (!session) return;

  if (req.method === "GET") {
    const items = await purchaseService.getHistory(session.user.id);
    return sendOk(res, { items });
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    const { productId, externalId, metadata } = req.body || {};
    if (!productId) return sendError(res, "productId is required.", 400);

    try {
      const purchase = await purchaseService.create(
        session.user.id,
        productId,
        { externalId, metadata },
      );
      await logActivity(req, "purchase.create", {
        actor: "user",
        actorId: session.user.id,
        actorEmail: session.user.email,
        resource: "purchase",
        resourceId: purchase.id,
      });
      return sendOk(res, purchase, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return sendError(res, "Method not allowed.", 405);
}

/** Public product listing for storefront */
export async function publicProductController(
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

  const items = await productService.list();
  sendOk(res, { items });
}
