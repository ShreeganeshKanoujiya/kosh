import "server-only";
import { prisma, type DbClient } from "@/lib/db/prisma";

export const categoryRepository = {
  list(companyId: string, options: { activeOnly?: boolean } = {}, db: DbClient = prisma) {
    return db.category.findMany({
      where: { companyId, ...(options.activeOnly ? { isActive: true } : {}) },
      include: { _count: { select: { entries: { where: { deletedAt: null } } } } },
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
    });
  },

  findById(companyId: string, id: string, db: DbClient = prisma) {
    return db.category.findUnique({
      where: { companyId_id: { companyId, id } },
      include: { _count: { select: { entries: { where: { deletedAt: null } } } } },
    });
  },

  findByName(companyId: string, name: string, db: DbClient = prisma) {
    return db.category.findFirst({ where: { companyId, name: { equals: name, mode: "insensitive" } } });
  },

  create(companyId: string, data: { name: string; description: string | null; isActive: boolean }, db: DbClient = prisma) {
    return db.category.create({
      data: { companyId, ...data },
      include: { _count: { select: { entries: { where: { deletedAt: null } } } } },
    });
  },

  update(
    companyId: string,
    id: string,
    data: { name?: string; description?: string | null; isActive?: boolean },
    db: DbClient = prisma,
  ) {
    return db.category.update({
      where: { companyId_id: { companyId, id } },
      data,
      include: { _count: { select: { entries: { where: { deletedAt: null } } } } },
    });
  },

  /** Any entry (even soft-deleted) keeps a category referenced. */
  countAllEntries(companyId: string, id: string, db: DbClient = prisma) {
    return db.pettyCashEntry.count({ where: { companyId, categoryId: id } });
  },

  delete(companyId: string, id: string, db: DbClient = prisma) {
    return db.category.delete({ where: { companyId_id: { companyId, id } } });
  },
};
