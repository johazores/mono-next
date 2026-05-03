import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import { productPriceService } from "@/services/product-price-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

export async function productPriceCollectionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const productId = String(req.query.id || "");
  if (!productId) return sendError(res, "productId is required.", 400);

  if (req.method === "GET") {
    const items = await productPriceService.listByProduct(productId);
    return sendOk(res, { items });
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    try {
      const price = await productPriceService.create({
        ...req.body,
        productId,
      });
      await logActivity(req, "price.create", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "productPrice",
        resourceId: price.id,
        metadata: { productId, label: price.label },
      });
      return sendOk(res, price, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return sendError(res, "Method not allowed.", 405);
}

export async function productPriceItemController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const id = String(req.query.priceId || "");
  if (!id) return sendError(res, "priceId is required.", 400);

  if (!verifyCsrf(req, res)) return;

  if (req.method === "PUT") {
    try {
      const price = await productPriceService.update(id, req.body);
      await logActivity(req, "price.update", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "productPrice",
        resourceId: id,
        metadata: { label: price.label },
      });
      return sendOk(res, price);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  if (req.method === "DELETE") {
    try {
      await productPriceService.delete(id);
      await logActivity(req, "price.delete", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "productPrice",
        resourceId: id,
      });
      return sendOk(res, { deleted: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  return sendError(res, "Method not allowed.", 405);
}
