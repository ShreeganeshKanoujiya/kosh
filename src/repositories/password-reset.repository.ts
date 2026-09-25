import "server-only";
import { prisma, type DbClient } from "@/lib/db/prisma";

export const passwordResetRepository = {
  create(data: { userId: string; tokenHash: string; expiresAt: Date; requestedIp: string | null }, db: DbClient = prisma) {
    return db.passwordResetToken.create({ data });
  },

  findByHash(tokenHash: string, db: DbClient = prisma) {
    return db.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: { select: { id: true, companyId: true, username: true, status: true, deletedAt: true } },
      },
    });
  },

  /** Single-use: returns false if the token was already consumed. */
  async markUsed(tokenId: string, db: DbClient) {
    const result = await db.passwordResetToken.updateMany({
      where: { id: tokenId, usedAt: null },
      data: { usedAt: new Date() },
    });
    return result.count === 1;
  },

  /** Invalidate every outstanding token for a user (e.g. after a successful reset). */
  invalidateForUser(userId: string, db: DbClient = prisma) {
    return db.passwordResetToken.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
  },
};
