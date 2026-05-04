import { pageRepository } from "@/repositories/page-repository";
import type { CreatePageInput, UpdatePageInput } from "@/types";
import type { Prisma } from "@prisma/client";

export const pageService = {
  list() {
    return pageRepository.list();
  },

  listPublished() {
    return pageRepository.listPublished();
  },

  getById(id: string) {
    return pageRepository.findById(id);
  },

  getBySlug(slug: string) {
    return pageRepository.findBySlug(slug);
  },

  async create(input: CreatePageInput) {
    if (!input.title) throw new Error("Title is required.");
    if (!input.slug) throw new Error("Slug is required.");

    return pageRepository.create({
      title: input.title,
      slug: input.slug,
      status: input.status || "draft",
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      blocks: (input.blocks || []) as unknown as Prisma.InputJsonValue,
    });
  },

  async update(id: string, input: UpdatePageInput) {
    return pageRepository.update(id, {
      title: input.title,
      slug: input.slug,
      status: input.status || "draft",
      seoTitle: input.seoTitle || null,
      seoDescription: input.seoDescription || null,
      blocks: (input.blocks || []) as unknown as Prisma.InputJsonValue,
    });
  },

  async delete(id: string) {
    return pageRepository.delete(id);
  },
};
