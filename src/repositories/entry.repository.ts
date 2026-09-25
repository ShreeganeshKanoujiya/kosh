import "server-only";
import { Prisma } from "@/generated/prisma/client";
import type { EntryStatus } from "@/generated/prisma/enums";
import { ymdToDate } from "@/lib/dates";
import { prisma, type DbClient } from "@/lib/db/prisma";
import type { ListEntriesQuery } from "@/validators/entry.schema";

const userRef = { select: { id: true, fullName: true, username: true } } as const;

export const entryInclude = {
  category: { select: { id: true, name: true } },
  cashAccount: { select: { id: true, name: true } },
  createdBy: userRef,
  verifiedBy: userRef,
  approvedBy: userRef,
  rejectedBy: userRef,
  _count: { select: { attachments: true } },
} as const satisfies Prisma.PettyCashEntryInclude;

export type EntryRow = Prisma.PettyCashEntryGetPayload<{ include: typeof entryInclude }>;

export type EntryFilters = Omit<ListEntriesQuery, "page" | "pageSize" | "sort">;

/** Every entry query goes through here: company scope and soft-delete are not optional. */
export function buildEntryWhere(companyId: string, f: EntryFilters): Prisma.PettyCashEntryWhereInput {
  const where: Prisma.PettyCashEntryWhereInput = { companyId, deletedAt: null };
  if (f.status?.length) where.status = { in: f.status as EntryStatus[] };
  if (f.type) where.type = f.type;
  if (f.categoryId) where.categoryId = f.categoryId;
  if (f.userId) where.createdById = f.userId;
  if (f.paymentMethod) where.paymentMethod = f.paymentMethod;
  if (f.source) where.source = f.source;
  if (f.cashAccountId) where.cashAccountId = f.cashAccountId;
  if (f.from || f.to) {
    where.entryDate = {
      ...(f.from ? { gte: ymdToDate(f.from) } : {}),
      ...(f.to ? { lte: ymdToDate(f.to) } : {}),
    };
  }
  if (f.minAmount !== undefined || f.maxAmount !== undefined) {
    where.amount = {
      ...(f.minAmount !== undefined ? { gte: new Prisma.Decimal(f.minAmount) } : {}),
      ...(f.maxAmount !== undefined ? { lte: new Prisma.Decimal(f.maxAmount) } : {}),
    };
  }
  if (f.search) {
    const q = f.search;
    where.OR = [
      { entryNumber: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { merchantName: { contains: q, mode: "insensitive" } },
      { upiId: { contains: q, mode: "insensitive" } },
      { transactionId: { contains: q, mode: "insensitive" } },
      { referenceNumber: { contains: q, mode: "insensitive" } },
      { createdBy: { username: { contains: q, mode: "insensitive" } } },
      { createdBy: { fullName: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

const ORDER: Record<ListEntriesQuery["sort"], Prisma.PettyCashEntryOrderByWithRelationInput[]> = {
  date_desc: [{ entryDate: "desc" }, { createdAt: "desc" }],
  date_asc: [{ entryDate: "asc" }, { createdAt: "asc" }],
  amount_desc: [{ amount: "desc" }, { createdAt: "desc" }],
  amount_asc: [{ amount: "asc" }, { createdAt: "desc" }],
};

export const entryRepository = {
  /** Atomic per-company counter; the row lock serialises concurrent creators. */
  async nextSequence(companyId: string, name: string, db: DbClient): Promise<number> {
    const rows = await db.$queryRaw<{ value: number }[]>`
      INSERT INTO company_counters (company_id, name, value)
      VALUES (${companyId}::uuid, ${name}, 1)
      ON CONFLICT (company_id, name) DO UPDATE SET value = company_counters.value + 1
      RETURNING value`;
    return Number(rows[0].value);
  },

  create(data: Prisma.PettyCashEntryUncheckedCreateInput, db: DbClient) {
    return db.pettyCashEntry.create({ data, include: entryInclude });
  },

  findById(companyId: string, id: string, db: DbClient = prisma) {
    return db.pettyCashEntry.findFirst({ where: { companyId, id, deletedAt: null }, include: entryInclude });
  },

  async list(companyId: string, query: ListEntriesQuery, db: DbClient = prisma) {
    const where = buildEntryWhere(companyId, query);
    const [items, total, sums] = await Promise.all([
      db.pettyCashEntry.findMany({
        where,
        include: entryInclude,
        orderBy: ORDER[query.sort],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      db.pettyCashEntry.count({ where }),
      db.pettyCashEntry.groupBy({ by: ["type"], where, _sum: { amount: true } }),
    ]);
    return { items, total, sums };
  },

  /**
   * Optimistic concurrency: the write only applies if the row still has the version
   * (and, optionally, one of the statuses) the caller saw. Returns false on a lost race.
   */
  async updateVersioned(
    companyId: string,
    id: string,
    expected: { version: number; statuses?: EntryStatus[] },
    data: Prisma.PettyCashEntryUncheckedUpdateManyInput,
    db: DbClient,
  ) {
    const result = await db.pettyCashEntry.updateMany({
      where: {
        companyId,
        id,
        deletedAt: null,
        version: expected.version,
        ...(expected.statuses ? { status: { in: expected.statuses } } : {}),
      },
      data: { ...data, version: { increment: 1 } },
    });
    return result.count === 1;
  },

  /**
   * Likely duplicates: the same external transaction id, or the same amount + date + merchant.
   * Plain cash entries with neither (two ₹20 teas on one day) are never flagged.
   */
  async findDuplicates(
    companyId: string,
    candidate: { transactionId: string | null; amount: Prisma.Decimal; entryDate: Date; merchantName: string | null },
    excludeId?: string,
    db: DbClient = prisma,
  ) {
    const or: Prisma.PettyCashEntryWhereInput[] = [];
    if (candidate.transactionId) or.push({ transactionId: { equals: candidate.transactionId, mode: "insensitive" } });
    if (candidate.merchantName) {
      or.push({
        amount: candidate.amount,
        entryDate: candidate.entryDate,
        merchantName: { equals: candidate.merchantName, mode: "insensitive" },
      });
    }
    if (!or.length) return [];
    return db.pettyCashEntry.findMany({
      where: {
        companyId,
        deletedAt: null,
        status: { not: "cancelled" },
        ...(excludeId ? { id: { not: excludeId } } : {}),
        OR: or,
      },
      select: {
        id: true,
        entryNumber: true,
        entryDate: true,
        amount: true,
        merchantName: true,
        transactionId: true,
        status: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
  },
};
