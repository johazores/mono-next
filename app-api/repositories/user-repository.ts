import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const safeSelect = {
  id: true,
  email: true,
  name: true,
  status: true,
  plan: true,
  subscriptionId: true,
  subscriptionEnds: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userRepository = {
  list() {
    return prisma.user.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: safeSelect,
    });
  },
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: safeSelect,
    });
  },
  findByEmailWithPassword(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  },
  count() {
    return prisma.user.count();
  },
  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },
  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },
  async delete(id: string) {
    await prisma.userSession.deleteMany({ where: { userId: id } });
    return prisma.user.delete({ where: { id } });
  },
  touchLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },
};
