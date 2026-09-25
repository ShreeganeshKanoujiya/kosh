import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { prisma, type DbClient } from "@/lib/db/prisma";

export const cashAccountRepository = {
  list(companyId: string, options: { activeOnly?: boolean } = {}, db: DbClient = prisma) {
    return db.cashAccount.findMany({
      where: { companyId, ...(options.activeOnly ? { isActive: true } : {}) },
      orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    });
  },

  findById(companyId: string, id: string, db: DbClient = prisma) {
    return db.cashAccount.findUnique({ where: { companyId_id: { companyId, id } } });
  },

  findByName(companyId: string, name: string, db: DbClient = prisma) {
    return db.cashAccount.findFirst({ where: { companyId, name: { equals: name, mode: "insensitive" } } });
  },

  create(
    companyId: string,
    data: { name: string; currency: string; openingBalance: string; isActive: boolean },
    db: DbClient = prisma,
  ) {
    return db.cashAccount.create({
      data: { companyId, ...data, currentBalance: data.openingBalance },
    });
  },

  update(companyId: string, id: string, data: Prisma.CashAccountUncheckedUpdateInput, db: DbClient = prisma) {
    return db.cashAccount.update({ where: { companyId_id: { companyId, id } }, data });
  },

  /**
   * Atomic `current_balance = current_balance + delta`. The UPDATE takes a row lock,
   * so concurrent approvals against the same account serialise correctly.
   */
  applyDelta(companyId: string, id: string, delta: Prisma.Decimal, db: DbClient) {
    return db.cashAccount.update({
      where: { companyId_id: { companyId, id } },
      data: { currentBalance: { increment: delta } },
    });
  },

  /** Recompute from source of truth: opening balance + signed sum of approved entries. */
  async recalculate(companyId: string, id: string, db: DbClient) {
    const rows = await db.$queryRaw<{ delta: Prisma.Decimal | null }[]>`
      SELECT SUM(CASE WHEN type = 'expense' THEN -amount ELSE amount END) AS delta
      FROM petty_cash_entries
      WHERE company_id = ${companyId}::uuid AND cash_account_id = ${id}::uuid
        AND status = 'approved' AND deleted_at IS NULL`;
    const account = await db.cashAccount.findUniqueOrThrow({ where: { companyId_id: { companyId, id } } });
    const balance = account.openingBalance.plus(rows[0]?.delta ?? new Prisma.Decimal(0));
    return db.cashAccount.update({ where: { companyId_id: { companyId, id } }, data: { currentBalance: balance } });
  },
};
