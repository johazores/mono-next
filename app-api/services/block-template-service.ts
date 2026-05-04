import { blockTemplateRepository } from "@/repositories/block-template-repository";
import type {
  CreateBlockTemplateInput,
  UpdateBlockTemplateInput,
} from "@/types";
import type { Prisma } from "@prisma/client";

export const blockTemplateService = {
  list() {
    return blockTemplateRepository.list();
  },

  listActive() {
    return blockTemplateRepository.listActive();
  },

  async getById(id: string) {
    const template = await blockTemplateRepository.findById(id);
    if (!template) throw new Error("Block template not found.");
    return template;
  },

  async getBySlug(slug: string) {
    const template = await blockTemplateRepository.findBySlug(slug);
    if (!template) throw new Error("Block template not found.");
    return template;
  },

  async create(input: CreateBlockTemplateInput) {
    if (!input.name?.trim()) throw new Error("Name is required.");
    if (!input.slug?.trim()) throw new Error("Slug is required.");

    const existing = await blockTemplateRepository.findBySlug(input.slug);
    if (existing)
      throw new Error("A block template with this slug already exists.");

    return blockTemplateRepository.create({
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description || null,
      icon: input.icon || null,
      category: input.category || "content",
      fields: (input.fields || []) as unknown as Prisma.InputJsonValue,
      defaults: (input.defaults || null) as Prisma.InputJsonValue,
      preview: input.preview || null,
      status: input.status || "active",
      sortOrder: input.sortOrder ?? 0,
    });
  },

  async update(id: string, input: UpdateBlockTemplateInput) {
    await blockTemplateService.getById(id);
    return blockTemplateRepository.update(id, {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.slug !== undefined && { slug: input.slug.trim() }),
      ...(input.description !== undefined && {
        description: input.description || null,
      }),
      ...(input.icon !== undefined && { icon: input.icon || null }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.fields !== undefined && {
        fields: input.fields as unknown as Prisma.InputJsonValue,
      }),
      ...(input.defaults !== undefined && {
        defaults: (input.defaults || null) as Prisma.InputJsonValue,
      }),
      ...(input.preview !== undefined && { preview: input.preview || null }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
    });
  },

  async delete(id: string) {
    await blockTemplateService.getById(id);
    return blockTemplateRepository.delete(id);
  },
};
