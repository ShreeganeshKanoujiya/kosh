import "server-only";
import type { PermissionKey } from "@/config/permissions";
import { prisma, type DbClient } from "@/lib/db/prisma";

export interface NewNotification {
  companyId: string;
  userId: string;
  type: string;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
}

export const notificationRepository = {
  createMany(items: NewNotification[], db: DbClient = prisma) {
    if (!items.length) return Promise.resolve({ count: 0 });
    return db.notification.createMany({ data: items });
  },

  listForUser(userId: string, limit = 30, db: DbClient = prisma) {
    return db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: limit });
  },

  countUnread(userId: string, db: DbClient = prisma) {
    return db.notification.count({ where: { userId, readAt: null } });
  },

  markRead(userId: string, ids: string[] | "all", db: DbClient = prisma) {
    return db.notification.updateMany({
      where: { userId, readAt: null, ...(ids === "all" ? {} : { id: { in: ids } }) },
      data: { readAt: new Date() },
    });
  },

  /** Active users in a company whose role grants any of the given permissions. */
  findUsersWithPermission(companyId: string, anyOf: PermissionKey[], db: DbClient = prisma) {
    return db.user.findMany({
      where: {
        companyId,
        status: "active",
        deletedAt: null,
        role: { permissions: { some: { permission: { key: { in: anyOf } } } } },
      },
      select: { id: true },
    });
  },
};
