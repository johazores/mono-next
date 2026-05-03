import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const adminRepository = {
  list() {
    return prisma.admin.findMany({
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
    return prisma.admin.findUnique({
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
    return prisma.admin.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  },
  findByIdWithPassword(id: string) {
    return prisma.admin.findUnique({ where: { id } });
  },
  count() {
    return prisma.admin.count();
  },
  countAdmins(exceptId?: string) {
    return prisma.admin.count({
      where: {
        role: "admin",
        status: "active",
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
    });
  },
  create(data: Prisma.AdminCreateInput) {
    return prisma.admin.create({ data });
  },
  update(id: string, data: Prisma.AdminUpdateInput) {
    return prisma.admin.update({ where: { id }, data });
  },
  async delete(id: string) {
    await prisma.adminSession.deleteMany({ where: { adminId: id } });
    return prisma.admin.delete({ where: { id } });
  },
  touchLastLogin(id: string) {
    return prisma.admin.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },
};
