import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const userRepository = {
  list() {
    return prisma.user.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },
  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
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
  countAdmins(exceptId?: string) {
    return prisma.user.count({
      where: {
        role: "admin",
        status: "active",
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
  },
  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  },
  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
  touchLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },
};
