import type { NextApiRequest, NextApiResponse } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { sendError, sendOk } from "@/lib/api-response";
import {
  taxonomyService,
  taxonomyTermService,
} from "@/services/taxonomy-service";
import { logActivity } from "@/lib/activity-logger";
import { verifyCsrf } from "@/lib/csrf";

// ---------------------------------------------------------------------------
// Taxonomy CRUD
// ---------------------------------------------------------------------------

export async function taxonomyCollectionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  if (req.method === "GET") {
    const items = await taxonomyService.list();
    return sendOk(res, { items });
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    try {
      const taxonomy = await taxonomyService.create(req.body);
      await logActivity(req, "taxonomy.create", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "taxonomy",
        resourceId: taxonomy.id,
      });
      return sendOk(res, taxonomy, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return sendError(res, "Method not allowed.", 405);
}

export async function taxonomyItemController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const id = String(req.query.id || "");

  if (req.method === "GET") {
    const taxonomy = await taxonomyService.getById(id);
    if (!taxonomy) return sendError(res, "Taxonomy not found.", 404);
    return sendOk(res, taxonomy);
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "PUT") {
    try {
      const taxonomy = await taxonomyService.update(id, req.body);
      await logActivity(req, "taxonomy.update", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "taxonomy",
        resourceId: id,
      });
      return sendOk(res, taxonomy);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  if (req.method === "DELETE") {
    try {
      await taxonomyService.delete(id);
      await logActivity(req, "taxonomy.delete", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "taxonomy",
        resourceId: id,
      });
      return sendOk(res, { deleted: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return sendError(res, "Method not allowed.", 405);
}

// ---------------------------------------------------------------------------
// Taxonomy term CRUD
// ---------------------------------------------------------------------------

export async function taxonomyTermCollectionController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const taxonomyId = String(req.query.id || "");

  if (req.method === "GET") {
    const items = await taxonomyTermService.listByTaxonomy(taxonomyId);
    return sendOk(res, { items });
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "POST") {
    try {
      const term = await taxonomyTermService.create(taxonomyId, req.body);
      await logActivity(req, "taxonomy-term.create", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "taxonomy-term",
        resourceId: term.id,
      });
      return sendOk(res, term, 201);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return sendError(res, "Method not allowed.", 405);
}

export async function taxonomyTermItemController(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const session = await requireAdmin(req, res);
  if (!session) return;

  const termId = String(req.query.termId || "");

  if (req.method === "GET") {
    const term = await taxonomyTermService.getById(termId);
    if (!term) return sendError(res, "Taxonomy term not found.", 404);
    return sendOk(res, term);
  }

  if (!verifyCsrf(req, res)) return;

  if (req.method === "PUT") {
    try {
      const term = await taxonomyTermService.update(termId, req.body);
      await logActivity(req, "taxonomy-term.update", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "taxonomy-term",
        resourceId: termId,
      });
      return sendOk(res, term);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  if (req.method === "DELETE") {
    try {
      await taxonomyTermService.delete(termId);
      await logActivity(req, "taxonomy-term.delete", {
        actor: "admin",
        actorId: session.admin.id,
        actorEmail: session.admin.email,
        resource: "taxonomy-term",
        resourceId: termId,
      });
      return sendOk(res, { deleted: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed.";
      return sendError(res, message, 400);
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return sendError(res, "Method not allowed.", 405);
}
