import { prisma } from "@/lib/prisma";

export const checkoutRepository = {
  create(data: {
    sessionId: string;
    userId?: string;
    guestEmail?: string;
    guestName?: string;
    items: unknown;
    provider: string;
    metadata?: unknown;
  }) {
    return prisma.checkoutSession.create({ data: data as never });
  },

  findBySessionId(sessionId: string) {
    return prisma.checkoutSession.findUnique({ where: { sessionId } });
  },

  updateStatus(id: string, status: string) {
    return prisma.checkoutSession.update({
      where: { id },
      data: { status },
    });
  },
};
