import { prisma } from "@/lib/prisma";

export const featureRepository = {
  list() {
    return prisma.feature.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
    });
  },

  listAll() {
    return prisma.feature.findMany({
      orderBy: [{ sortOrder: "asc" }, { key: "asc" }],
    });
  },

  findById(id: string) {
    return prisma.feature.findUnique({ where: { id } });
  },

  findByKey(key: string) {
    return prisma.feature.findUnique({ where: { key } });
  },

  create(data: {
    key: string;
    description: string;
    category: string;
    isActive?: boolean;
    sortOrder?: number;
  }) {
    return prisma.feature.create({ data });
  },

  update(
    id: string,
    data: {
      key?: string;
      description?: string;
      category?: string;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    return prisma.feature.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.feature.delete({ where: { id } });
  },
};
