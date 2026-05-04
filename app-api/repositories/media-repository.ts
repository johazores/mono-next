import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const mediaRepository = {
  list() {
    return prisma.media.findMany({ orderBy: { createdAt: "desc" } });
  },

  findById(id: string) {
    return prisma.media.findUnique({ where: { id } });
  },

  create(data: Prisma.MediaCreateInput) {
    return prisma.media.create({ data });
  },

  update(id: string, data: Prisma.MediaUpdateInput) {
    return prisma.media.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.media.delete({ where: { id } });
  },
};
