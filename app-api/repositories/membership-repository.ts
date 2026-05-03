import { prisma } from "@/lib/prisma";

export const membershipRepository = {
  findActiveByUserId(userId: string) {
    return prisma.membership.findMany({
      where: { userId, status: "active" },
      orderBy: { createdAt: "desc" },
    });
  },

  findByUserId(userId: string) {
    return prisma.membership.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  create(data: {
    userId: string;
    type: string;
    sourceId: string;
    featureKeys: string[];
    status?: string;
    expiresAt?: Date | null;
  }) {
    return prisma.membership.create({
      data: {
        user: { connect: { id: data.userId } },
        type: data.type,
        sourceId: data.sourceId,
        featureKeys: data.featureKeys,
        status: data.status ?? "active",
        expiresAt: data.expiresAt ?? null,
      },
    });
  },

  revokeBySourceId(sourceId: string) {
    return prisma.membership.updateMany({
      where: { sourceId, status: "active" },
      data: { status: "revoked" },
    });
  },

  revoke(id: string) {
    return prisma.membership.update({
      where: { id },
      data: { status: "revoked" },
    });
  },
};
