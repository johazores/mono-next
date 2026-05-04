import type { Prisma } from "@prisma/client";
import { contentItemRepository } from "@/repositories/content-item-repository";
import { contentTypeRepository } from "@/repositories/content-type-repository";
import type { ContentFieldDefinition } from "@/types";

function generateSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "untitled"
  );
}

function coerceFieldValue(
  field: ContentFieldDefinition,
  value: unknown,
): unknown {
  if (value === undefined || value === null) {
    switch (field.type) {
      case "array-text":
      case "gallery-list":
      case "document-list":
      case "rate-table-list":
      case "pair-list":
        return [];
      case "grouped-pair-list":
        return {};
      case "number":
        return 0;
      case "taxonomy":
        return field.multiple ? [] : null;
      default:
        return null;
    }
  }
  if (field.type === "number") return Number(value);
  if (field.type === "taxonomy") {
    if (field.multiple) {
      return Array.isArray(value) ? value : value ? [value] : [];
    }
    return value || null;
  }
  return value;
}

export const contentItemService = {
  listByType(typeSlug: string) {
    return contentItemRepository.listByType(typeSlug);
  },

  listPublishedByType(typeSlug: string) {
    return contentItemRepository.listPublishedByType(typeSlug);
  },

  getById(id: string) {
    return contentItemRepository.findById(id);
  },

  getBySlug(typeSlug: string, slug: string) {
    return contentItemRepository.findBySlug(typeSlug, slug);
  },

  async create(typeSlug: string, input: Record<string, unknown>) {
    const contentType = await contentTypeRepository.findBySlug(typeSlug);
    if (!contentType) throw new Error(`Content type "${typeSlug}" not found.`);

    const settings = (contentType.settings || {}) as Record<string, unknown>;
    const fields = (contentType.fields || []) as ContentFieldDefinition[];
    const listDisplay = (contentType.listDisplay || {}) as Record<
      string,
      unknown
    >;
    const titleField = (listDisplay.titleField as string) || "name";

    const slug =
      (input.slug as string) ||
      generateSlug(
        (input[settings.slugSource as string] as string) ||
          (input.name as string) ||
          "",
      );
    const title =
      (input[titleField] as string) ||
      (input.name as string) ||
      (input.title as string) ||
      slug;
    const status =
      (input.status as string) || (settings.defaultStatus as string) || "draft";
    const sortOrder = Number(input.sortOrder ?? 0);

    const data: Record<string, unknown> = {};
    for (const field of fields) {
      data[field.name] = coerceFieldValue(field, input[field.name]);
    }

    return contentItemRepository.create({
      contentTypeId: contentType.id,
      contentTypeSlug: typeSlug,
      slug,
      title,
      data: data as Prisma.InputJsonValue,
      status,
      sortOrder,
    });
  },

  async update(id: string, typeSlug: string, input: Record<string, unknown>) {
    const contentType = await contentTypeRepository.findBySlug(typeSlug);
    if (!contentType) throw new Error(`Content type "${typeSlug}" not found.`);

    const settings = (contentType.settings || {}) as Record<string, unknown>;
    const fields = (contentType.fields || []) as ContentFieldDefinition[];
    const listDisplay = (contentType.listDisplay || {}) as Record<
      string,
      unknown
    >;
    const titleField = (listDisplay.titleField as string) || "name";

    const slug = (input.slug as string) || undefined;
    const title =
      (input[titleField] as string) ||
      (input.name as string) ||
      (input.title as string) ||
      undefined;
    const status =
      (input.status as string) || (settings.defaultStatus as string) || "draft";
    const sortOrder = Number(input.sortOrder ?? 0);

    const data: Record<string, unknown> = {};
    for (const field of fields) {
      data[field.name] = coerceFieldValue(field, input[field.name]);
    }

    const updatePayload: Record<string, unknown> = {
      data: data as Prisma.InputJsonValue,
      status,
      sortOrder,
    };
    if (slug) updatePayload.slug = slug;
    if (title) updatePayload.title = title;

    return contentItemRepository.update(id, updatePayload);
  },

  async delete(id: string) {
    return contentItemRepository.delete(id);
  },
};
