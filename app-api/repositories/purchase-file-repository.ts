import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const purchaseFileRepository = {
  findByPurchase(purchaseId: string) {
    return prisma.purchaseFile.findMany({
      where: { purchaseId },
      orderBy: { createdAt: "asc" },
    });
  },

  findById(id: string) {
    return prisma.purchaseFile.findUnique({ where: { id } });
  },

  create(data: Prisma.PurchaseFileCreateInput) {
    return prisma.purchaseFile.create({ data });
  },

  delete(id: string) {
    return prisma.purchaseFile.delete({ where: { id } });
  },

  findByPurchaseIds(purchaseIds: string[]) {
    return prisma.purchaseFile.findMany({
      where: { purchaseId: { in: purchaseIds } },
      orderBy: { createdAt: "asc" },
    });
  },
};
