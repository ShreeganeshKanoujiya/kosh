import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";

export interface AuditQuery {
  page: number;
  pageSize: number;
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  from?: Date;
  to?: Date;
}

export const auditQueryRepository = {
  async list(companyId: string, q: AuditQuery) {
    const where: Prisma.AuditLogWhereInput = {
      companyId,
      ...(q.entityType ? { entityType: q.entityType } : {}),
      ...(q.entityId ? { entityId: q.entityId } : {}),
      ...(q.userId ? { userId: q.userId } : {}),
      ...(q.action ? { action: { startsWith: q.action } } : {}),
      ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lt: q.to } : {}) } } : {}),
    };
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);
    // audit_logs.user_id intentionally has no FK; resolve names separately (company-scoped).
    const userIds = [...new Set(items.map((i) => i.userId).filter((id): id is string => Boolean(id)))];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { companyId, id: { in: userIds } },
          select: { id: true, fullName: true, username: true },
        })
      : [];
    return { items, total, users: new Map(users.map((u) => [u.id, u])) };
  },
};
