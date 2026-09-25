import "server-only";
import { prisma, type DbClient } from "@/lib/db/prisma";

export const companyRepository = {
  findByCode(companyCode: string, db: DbClient = prisma) {
    return db.company.findUnique({ where: { companyCode } });
  },

  findById(companyId: string, db: DbClient = prisma) {
    return db.company.findUnique({ where: { id: companyId } });
  },

  create(data: { companyCode: string; name: string }, db: DbClient) {
    return db.company.create({ data });
  },

  setOwner(companyId: string, ownerUserId: string, db: DbClient) {
    return db.company.update({ where: { id: companyId }, data: { ownerUserId } });
  },

  createSettings(companyId: string, data: { defaultCashAccountId: string | null }, db: DbClient) {
    return db.companySettings.create({ data: { companyId, ...data } });
  },

  createCashAccount(companyId: string, data: { name: string; currency: string }, db: DbClient) {
    return db.cashAccount.create({ data: { companyId, ...data } });
  },

  createCategories(companyId: string, names: { name: string; description?: string }[], db: DbClient) {
    return db.category.createMany({ data: names.map((c) => ({ companyId, ...c })) });
  },
};
