import "server-only";
import { prisma, type DbClient } from "@/lib/db/prisma";
import type { RequestMeta } from "@/lib/security/request-meta";

export const loginAttemptRepository = {
  record(
    data: {
      companyId: string | null;
      userId: string | null;
      companyCode: string;
      username: string;
      success: boolean;
      failureReason?: string | null;
    } & RequestMeta,
    db: DbClient = prisma,
  ) {
    return db.loginAttempt.create({
      data: {
        ...data,
        companyCode: data.companyCode.slice(0, 12),
        username: data.username.slice(0, 64),
        failureReason: data.failureReason ?? null,
      },
    });
  },

  /** Failures since the later of `since` and the last successful login. */
  async countRecentFailures(companyCode: string, username: string, since: Date, db: DbClient = prisma) {
    const lastSuccess = await db.loginAttempt.findFirst({
      where: { companyCode, username, success: true, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    return db.loginAttempt.count({
      where: { companyCode, username, success: false, createdAt: { gt: lastSuccess?.createdAt ?? since } },
    });
  },

  oldestRecentFailure(companyCode: string, username: string, since: Date, db: DbClient = prisma) {
    return db.loginAttempt.findFirst({
      where: { companyCode, username, success: false, createdAt: { gt: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
  },

  listForUser(userId: string, limit = 20, db: DbClient = prisma) {
    return db.loginAttempt.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
  },
};
