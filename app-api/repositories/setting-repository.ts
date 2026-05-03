import { prisma } from "@/lib/prisma";

export const settingRepository = {
  async get(key: string) {
    return prisma.siteSetting.findUnique({ where: { key } });
  },

  async getMany(keys: string[]) {
    return prisma.siteSetting.findMany({ where: { key: { in: keys } } });
  },

  async getAll() {
    return prisma.siteSetting.findMany({ orderBy: { key: "asc" } });
  },

  async set(key: string, value: unknown) {
    return prisma.siteSetting.upsert({
      where: { key },
      update: { value: value as never },
      create: { key, value: value as never },
    });
  },
};
