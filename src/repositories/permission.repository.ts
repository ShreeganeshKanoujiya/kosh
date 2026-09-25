import "server-only";
import { prisma, type DbClient } from "@/lib/db/prisma";

export const permissionRepository = {
  listAll(db: DbClient = prisma) {
    return db.permission.findMany({ orderBy: { key: "asc" } });
  },

  count(db: DbClient = prisma) {
    return db.permission.count();
  },

  findByKeys(keys: readonly string[], db: DbClient = prisma) {
    return db.permission.findMany({ where: { key: { in: [...keys] } }, select: { id: true, key: true } });
  },

  async upsertMany(entries: { key: string; group: string; description: string }[], db: DbClient = prisma) {
    for (const entry of entries) {
      await db.permission.upsert({
        where: { key: entry.key },
        create: entry,
        update: { group: entry.group, description: entry.description },
      });
    }
  },
};
