import {
  taxonomyRepository,
  taxonomyTermRepository,
} from "@/repositories/taxonomy-repository";
import type {
  CreateTaxonomyInput,
  UpdateTaxonomyInput,
  CreateTaxonomyTermInput,
  UpdateTaxonomyTermInput,
} from "@/types";

function generateSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "untitled"
  );
}

export const taxonomyService = {
  list() {
    return taxonomyRepository.list();
  },

  listActive() {
    return taxonomyRepository.listActive();
  },

  listForContentType(contentTypeSlug: string) {
    return taxonomyRepository.listForContentType(contentTypeSlug);
  },

  getById(id: string) {
    return taxonomyRepository.findById(id);
  },

  getBySlug(slug: string) {
    return taxonomyRepository.findBySlug(slug);
  },

  async create(input: CreateTaxonomyInput) {
    if (!input.name) throw new Error("Name is required.");

    return taxonomyRepository.create({
      name: input.name,
      slug: input.slug || generateSlug(input.name),
      pluralName: input.pluralName || input.name,
      description: input.description || null,
      hierarchical: Boolean(input.hierarchical),
      contentTypes: input.contentTypes || [],
      status: input.status || "active",
      sortOrder: Number(input.sortOrder ?? 0),
    });
  },

  async update(id: string, input: UpdateTaxonomyInput) {
    return taxonomyRepository.update(id, {
      name: input.name,
      slug: input.slug,
      pluralName: input.pluralName || (input.name ? input.name : undefined),
      description: input.description || null,
      hierarchical:
        input.hierarchical !== undefined
          ? Boolean(input.hierarchical)
          : undefined,
      contentTypes: input.contentTypes,
      status: input.status || "active",
      sortOrder:
        input.sortOrder !== undefined ? Number(input.sortOrder) : undefined,
    });
  },

  async delete(id: string) {
    await taxonomyTermRepository.deleteByTaxonomy(id);
    return taxonomyRepository.delete(id);
  },
};

export const taxonomyTermService = {
  listByTaxonomy(taxonomyId: string) {
    return taxonomyTermRepository.listByTaxonomy(taxonomyId);
  },

  getById(id: string) {
    return taxonomyTermRepository.findById(id);
  },

  async create(taxonomyId: string, input: CreateTaxonomyTermInput) {
    if (!input.name) throw new Error("Name is required.");

    return taxonomyTermRepository.create({
      taxonomyId,
      name: input.name,
      slug: input.slug || generateSlug(input.name),
      description: input.description || null,
      imageUrl: input.imageUrl || null,
      parentId: input.parentId || null,
      sortOrder: Number(input.sortOrder ?? 0),
    });
  },

  async update(id: string, input: UpdateTaxonomyTermInput) {
    return taxonomyTermRepository.update(id, {
      name: input.name,
      slug: input.slug,
      description: input.description || null,
      imageUrl: input.imageUrl || null,
      parentId: input.parentId || null,
      sortOrder:
        input.sortOrder !== undefined ? Number(input.sortOrder) : undefined,
    });
  },

  async delete(id: string) {
    return taxonomyTermRepository.delete(id);
  },
};
