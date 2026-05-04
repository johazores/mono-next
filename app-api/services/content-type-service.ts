import { contentTypeRepository } from "@/repositories/content-type-repository";
import type { CreateContentTypeInput, UpdateContentTypeInput } from "@/types";
import type { Prisma } from "@prisma/client";

const DEFAULT_SETTINGS = {
  hasSlug: true,
  hasStatus: true,
  hasSortOrder: true,
  slugSource: "name",
  defaultStatus: "draft",
};

const DEFAULT_LIST_DISPLAY = {
  titleField: "name",
  subtitleField: null,
  imageField: null,
};

const DEFAULT_PUBLIC_SETTINGS = {
  hasPublicList: false,
  hasDetailPage: false,
  urlPrefix: null,
};

export const contentTypeService = {
  list() {
    return contentTypeRepository.list();
  },

  listActive() {
    return contentTypeRepository.listActive();
  },

  getById(id: string) {
    return contentTypeRepository.findById(id);
  },

  getBySlug(slug: string) {
    return contentTypeRepository.findBySlug(slug);
  },

  async create(input: CreateContentTypeInput) {
    if (!input.name) throw new Error("Name is required.");
    if (!input.slug) throw new Error("Slug is required.");

    return contentTypeRepository.create({
      name: input.name,
      slug: input.slug,
      pluralName: input.pluralName || input.name + "s",
      icon: input.icon || null,
      description: input.description || null,
      fields: (input.fields || []) as unknown as Prisma.InputJsonValue,
      settings: (input.settings ||
        DEFAULT_SETTINGS) as unknown as Prisma.InputJsonValue,
      listDisplay: (input.listDisplay ||
        DEFAULT_LIST_DISPLAY) as unknown as Prisma.InputJsonValue,
      publicSettings: (input.publicSettings ||
        DEFAULT_PUBLIC_SETTINGS) as unknown as Prisma.InputJsonValue,
      status: input.status || "active",
      sortOrder: Number(input.sortOrder ?? 0),
    });
  },

  async update(id: string, input: UpdateContentTypeInput) {
    return contentTypeRepository.update(id, {
      name: input.name,
      slug: input.slug,
      pluralName:
        input.pluralName || (input.name ? input.name + "s" : undefined),
      icon: input.icon || null,
      description: input.description || null,
      fields: (input.fields || []) as unknown as Prisma.InputJsonValue,
      settings: (input.settings || {}) as unknown as Prisma.InputJsonValue,
      listDisplay: (input.listDisplay ||
        {}) as unknown as Prisma.InputJsonValue,
      publicSettings: (input.publicSettings ||
        {}) as unknown as Prisma.InputJsonValue,
      status: input.status || "active",
      sortOrder: Number(input.sortOrder ?? 0),
    });
  },

  async delete(id: string) {
    return contentTypeRepository.delete(id);
  },
};
