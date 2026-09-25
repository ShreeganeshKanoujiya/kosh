import "server-only";
import { prisma, type DbClient } from "@/lib/db/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const auditRepository = {
  create(data: Prisma.AuditLogUncheckedCreateInput, db: DbClient = prisma) {
    return db.auditLog.create({ data });
  },
};
