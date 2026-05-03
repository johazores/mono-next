import { planRepository } from "@/repositories/plan-repository";
import type { CreatePlanInput, UpdatePlanInput, PlanRecord } from "@/types";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ALLOWED_INTERVALS = ["month", "year"];

function validateSlug(slug: string): string {
  const cleaned = slug.toLowerCase().trim();
  if (!cleaned || !SLUG_REGEX.test(cleaned)) {
    throw new Error(
      "Slug must be lowercase alphanumeric with hyphens only (e.g. 'pro-monthly').",
    );
  }
  if (cleaned.length > 50) {
    throw new Error("Slug must be 50 characters or fewer.");
  }
  return cleaned;
}

export const planService = {
  list() {
    return planRepository.list();
  },

  listAll() {
    return planRepository.listAll();
  },

  getById(id: string) {
    return planRepository.findById(id);
  },

  getBySlug(slug: string) {
    return planRepository.findBySlug(slug);
  },

  async create(input: CreatePlanInput): Promise<PlanRecord> {
    const name = (input.name || "").trim();
    if (name.length < 2 || name.length > 100) {
      throw new Error("Name must be between 2 and 100 characters.");
    }

    const slug = validateSlug(input.slug);

    const existing = await planRepository.findBySlug(slug);
    if (existing) throw new Error("A plan with this slug already exists.");

    const price = input.price ?? 0;
    if (price < 0) throw new Error("Price must be zero or positive.");

    const interval = ALLOWED_INTERVALS.includes(input.interval ?? "month")
      ? (input.interval ?? "month")
      : "month";

    return planRepository.create({
      name,
      slug,
      description: input.description || null,
      price,
      currency: (input.currency || "USD").toUpperCase().trim(),
      interval,
      features: input.features ?? [],
      sortOrder: input.sortOrder ?? 0,
    });
  },

  async update(id: string, input: UpdatePlanInput): Promise<PlanRecord | null> {
    const current = await planRepository.findById(id);
    if (!current) throw new Error("Plan not found.");

    const data: Record<string, unknown> = {};

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length < 2 || name.length > 100) {
        throw new Error("Name must be between 2 and 100 characters.");
      }
      data.name = name;
    }

    if (input.slug !== undefined) {
      const slug = validateSlug(input.slug);
      if (slug !== current.slug) {
        const existing = await planRepository.findBySlug(slug);
        if (existing) throw new Error("A plan with this slug already exists.");
      }
      data.slug = slug;
    }

    if (input.description !== undefined)
      data.description = input.description || null;
    if (input.price !== undefined) {
      if (input.price < 0) throw new Error("Price must be zero or positive.");
      data.price = input.price;
    }
    if (input.currency !== undefined)
      data.currency = input.currency.toUpperCase().trim();
    if (input.interval !== undefined) {
      if (!ALLOWED_INTERVALS.includes(input.interval)) {
        throw new Error("Interval must be 'month' or 'year'.");
      }
      data.interval = input.interval;
    }
    if (input.features !== undefined) data.features = input.features;
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.sortOrder !== undefined) data.sortOrder = input.sortOrder;

    if (Object.keys(data).length === 0) throw new Error("No fields to update.");

    return planRepository.update(id, data) as Promise<PlanRecord>;
  },

  async delete(id: string): Promise<PlanRecord | null> {
    const current = await planRepository.findById(id);
    if (!current) throw new Error("Plan not found.");

    const activeCount = await planRepository.countActiveSubscriptions(id);
    if (activeCount > 0) {
      throw new Error(
        "Cannot deactivate a plan with active subscriptions. Reassign users first.",
      );
    }

    return planRepository.update(id, {
      isActive: false,
    }) as Promise<PlanRecord>;
  },
};
