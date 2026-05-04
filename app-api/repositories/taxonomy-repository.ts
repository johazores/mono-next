import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const taxonomyRepository = {
  list() {
    return prisma.taxonomy.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { terms: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    });
  },

  listActive() {
    return prisma.taxonomy.findMany({
      where: { status: "active" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { terms: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    });
  },

  listForContentType(contentTypeSlug: string) {
    return prisma.taxonomy.findMany({
      where: { status: "active", contentTypes: { has: contentTypeSlug } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: { terms: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    });
  },

  findById(id: string) {
    return prisma.taxonomy.findUnique({
      where: { id },
      include: { terms: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    });
  },

  findBySlug(slug: string) {
    return prisma.taxonomy.findFirst({
      where: { slug },
      include: { terms: { orderBy: [{ sortOrder: "asc" }, { name: "asc" }] } },
    });
  },

  create(data: Prisma.TaxonomyCreateInput) {
    return prisma.taxonomy.create({ data });
  },

  update(id: string, data: Prisma.TaxonomyUpdateInput) {
    return prisma.taxonomy.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.taxonomy.delete({ where: { id } });
  },
};

export const taxonomyTermRepository = {
  listByTaxonomy(taxonomyId: string) {
    return prisma.taxonomyTerm.findMany({
      where: { taxonomyId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  },

  findById(id: string) {
    return prisma.taxonomyTerm.findUnique({ where: { id } });
  },

  findBySlug(taxonomyId: string, slug: string) {
    return prisma.taxonomyTerm.findFirst({
      where: { taxonomyId, slug },
    });
  },

  create(data: Prisma.TaxonomyTermUncheckedCreateInput) {
    return prisma.taxonomyTerm.create({ data });
  },

  update(id: string, data: Prisma.TaxonomyTermUpdateInput) {
    return prisma.taxonomyTerm.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.taxonomyTerm.delete({ where: { id } });
  },

  deleteByTaxonomy(taxonomyId: string) {
    return prisma.taxonomyTerm.deleteMany({ where: { taxonomyId } });
  },
};
