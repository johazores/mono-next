import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const planRepository = {
  list() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  },

  listAll() {
    return prisma.plan.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
  },

  findById(id: string) {
    return prisma.plan.findUnique({ where: { id } });
  },

  findBySlug(slug: string) {
    return prisma.plan.findUnique({ where: { slug } });
  },

  create(data: Prisma.PlanCreateInput) {
    return prisma.plan.create({ data });
  },

  update(id: string, data: Prisma.PlanUpdateInput) {
    return prisma.plan.update({ where: { id }, data });
  },

  countActiveSubscriptions(planId: string) {
    return prisma.subscription.count({
      where: { planId, status: "active" },
    });
  },
};
