import "server-only";
import { prisma, type DbClient } from "@/lib/db/prisma";
import type { RequestMeta } from "@/lib/security/request-meta";

export const sessionRepository = {
  create(data: { userId: string; companyId: string; expiresAt: Date } & RequestMeta, db: DbClient = prisma) {
    return db.session.create({ data });
  },

  /** Everything needed to build an AuthContext, in one round trip. */
  findWithIdentity(sessionId: string, userId: string, db: DbClient = prisma) {
    return db.session.findFirst({
      where: { id: sessionId, userId },
      select: {
        id: true,
        companyId: true,
        expiresAt: true,
        revokedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            avatarPath: true,
            status: true,
            deletedAt: true,
            roleId: true,
            role: {
              select: {
                key: true,
                name: true,
                permissions: { select: { permission: { select: { key: true } } } },
              },
            },
          },
        },
        company: { select: { id: true, companyCode: true, name: true, status: true, ownerUserId: true } },
      },
    });
  },

  findById(sessionId: string, db: DbClient = prisma) {
    return db.session.findUnique({ where: { id: sessionId } });
  },

  touch(sessionId: string, meta: RequestMeta, db: DbClient = prisma) {
    return db.session.update({
      where: { id: sessionId },
      data: { lastUsedAt: new Date(), ipAddress: meta.ipAddress, userAgent: meta.userAgent },
    });
  },

  /** Revokes the session (token family) and every refresh token in it. */
  async revoke(sessionId: string, reason: string, db: DbClient = prisma) {
    const now = new Date();
    await db.session.updateMany({ where: { id: sessionId, revokedAt: null }, data: { revokedAt: now, revokedReason: reason } });
    await db.refreshToken.updateMany({ where: { sessionId, revokedAt: null }, data: { revokedAt: now } });
  },

  async revokeAllForUser(userId: string, reason: string, options: { exceptSessionId?: string } = {}, db: DbClient = prisma) {
    const now = new Date();
    const where = {
      userId,
      revokedAt: null,
      ...(options.exceptSessionId ? { id: { not: options.exceptSessionId } } : {}),
    };
    const sessions = await db.session.findMany({ where, select: { id: true } });
    if (!sessions.length) return 0;
    const ids = sessions.map((s) => s.id);
    await db.session.updateMany({ where: { id: { in: ids } }, data: { revokedAt: now, revokedReason: reason } });
    await db.refreshToken.updateMany({ where: { sessionId: { in: ids }, revokedAt: null }, data: { revokedAt: now } });
    return ids.length;
  },

  listActiveForUser(userId: string, db: DbClient = prisma) {
    return db.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: "desc" },
      take: 50,
    });
  },
};

export const refreshTokenRepository = {
  create(
    data: { id?: string; sessionId: string; userId: string; tokenHash: string; expiresAt: Date } & RequestMeta,
    db: DbClient = prisma,
  ) {
    return db.refreshToken.create({ data });
  },

  findByHash(tokenHash: string, db: DbClient = prisma) {
    return db.refreshToken.findUnique({
      where: { tokenHash },
      include: { session: { select: { id: true, userId: true, companyId: true, expiresAt: true, revokedAt: true } } },
    });
  },

  /**
   * Atomically mark a token as rotated. Returns false if another request already
   * rotated it — the caller must then treat the request as a concurrent refresh.
   */
  async markRotated(tokenId: string, replacedById: string, db: DbClient) {
    const now = new Date();
    const result = await db.refreshToken.updateMany({
      where: { id: tokenId, revokedAt: null },
      data: { revokedAt: now, replacedById, lastUsedAt: now },
    });
    return result.count === 1;
  },
};
