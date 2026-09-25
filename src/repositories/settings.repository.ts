import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma, type DbClient } from "@/lib/db/prisma";

export const settingsRepository = {
  /** Settings row is created with the company, so this always exists for a live tenant. */
  get(companyId: string, db: DbClient = prisma) {
    return db.companySettings.findUniqueOrThrow({
      where: { companyId },
      include: { company: { select: { name: true, companyCode: true } } },
    });
  },

  update(companyId: string, data: Prisma.CompanySettingsUncheckedUpdateInput, db: DbClient = prisma) {
    return db.companySettings.update({
      where: { companyId },
      data,
      include: { company: { select: { name: true, companyCode: true } } },
    });
  },

  renameCompany(companyId: string, name: string, db: DbClient = prisma) {
    return db.company.update({ where: { id: companyId }, data: { name } });
  },
};
