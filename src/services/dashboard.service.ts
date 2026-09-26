import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { AWAITING_REVIEW_STATUSES, COUNTED_STATUSES, PAYMENT_METHODS } from "@/config/entries";
import { addDays, addMonths, startOfMonth, todayYmd, ymdToDate, dateToYmd } from "@/lib/dates";
import { prisma } from "@/lib/db/prisma";
import { money } from "@/lib/money";
import { cashAccountRepository } from "@/repositories/cash-account.repository";
import { entryInclude } from "@/repositories/entry.repository";
import { settingsRepository } from "@/repositories/settings.repository";
import { userRepository } from "@/repositories/user.repository";
import type { AuthContext } from "@/types/auth";
import type { DashboardDTO } from "@/types/dto";
import { toEntryDTO } from "./transaction.service";

const TREND_DAYS = 30;
const MONTHS_BACK = 6;
const num = (d: Prisma.Decimal | null | undefined) => (d ? Number(d.toFixed(2)) : 0);

/**
 * Everything on the dashboard, computed server-side in a handful of aggregate queries.
 * "Expenses" include entries awaiting review (recorded spend); the cash balance only
 * reflects approved entries.
 */
export async function getDashboard(auth: AuthContext): Promise<DashboardDTO> {
  const settings = await settingsRepository.get(auth.companyId);
  const today = todayYmd(settings.timezone);
  const monthStart = startOfMonth(today);
  const trendStart = addDays(today, -(TREND_DAYS - 1));
  const monthsStart = addMonths(monthStart, -(MONTHS_BACK - 1));

  const canReadEntries = auth.permissions.has("transactions.read");
  const canReadBalances = auth.permissions.has("cash_accounts.read");
  const base: Prisma.PettyCashEntryWhereInput = { companyId: auth.companyId, deletedAt: null };
  const counted: Prisma.PettyCashEntryWhereInput = { ...base, status: { in: COUNTED_STATUSES } };
  const expense = { ...counted, type: "expense" as const };

  const [accounts, activeUsers] = await Promise.all([
    canReadBalances ? cashAccountRepository.list(auth.companyId, { activeOnly: true }) : Promise.resolve([]),
    auth.permissions.has("users.read") ? userRepository.countActive(auth.companyId) : Promise.resolve(null),
  ]);

  const cashBalance = canReadBalances
    ? money(accounts.reduce((sum, a) => sum.plus(a.currentBalance), new Prisma.Decimal(0)))
    : null;

  if (!canReadEntries) {
    return {
      currency: settings.currency,
      timezone: settings.timezone,
      today,
      cashBalance,
      cashAccounts: accounts.map((a) => ({ id: a.id, name: a.name, balance: money(a.currentBalance) })),
      todayExpenses: "0.00",
      monthExpenses: "0.00",
      monthIncome: "0.00",
      pendingApprovals: { count: 0, amount: "0.00" },
      totalTransactions: 0,
      activeUsers,
      trend: [],
      categoryBreakdown: [],
      paymentBreakdown: [],
      monthly: [],
      recent: [],
    };
  }

  const [todaySum, monthSum, monthIncome, pendingCount, pendingExpense, total, trendRows, categoryRows, paymentRows, monthlyRows, recent] =
    await Promise.all([
      prisma.pettyCashEntry.aggregate({ where: { ...expense, entryDate: ymdToDate(today) }, _sum: { amount: true } }),
      prisma.pettyCashEntry.aggregate({
        where: { ...expense, entryDate: { gte: ymdToDate(monthStart), lte: ymdToDate(today) } },
        _sum: { amount: true },
      }),
      prisma.pettyCashEntry.aggregate({
        where: { ...counted, type: "income", entryDate: { gte: ymdToDate(monthStart), lte: ymdToDate(today) } },
        _sum: { amount: true },
      }),
      prisma.pettyCashEntry.count({ where: { ...base, status: { in: AWAITING_REVIEW_STATUSES } } }),
      prisma.pettyCashEntry.aggregate({
        where: { ...base, status: { in: AWAITING_REVIEW_STATUSES }, type: "expense" },
        _sum: { amount: true },
      }),
      prisma.pettyCashEntry.count({ where: base }),
      prisma.pettyCashEntry.groupBy({
        by: ["entryDate"],
        where: { ...expense, entryDate: { gte: ymdToDate(trendStart), lte: ymdToDate(today) } },
        _sum: { amount: true },
      }),
      prisma.pettyCashEntry.groupBy({
        by: ["categoryId"],
        where: { ...expense, entryDate: { gte: ymdToDate(monthStart), lte: ymdToDate(today) } },
        _sum: { amount: true },
      }),
      prisma.pettyCashEntry.groupBy({
        by: ["paymentMethod"],
        where: { ...expense, entryDate: { gte: ymdToDate(monthStart), lte: ymdToDate(today) } },
        _sum: { amount: true },
      }),
      prisma.$queryRaw<{ month: string; type: string; total: Prisma.Decimal }[]>`
        SELECT to_char(date_trunc('month', entry_date), 'YYYY-MM') AS month, type::text AS type, SUM(amount) AS total
        FROM petty_cash_entries
        WHERE company_id = ${auth.companyId}::uuid
          AND deleted_at IS NULL
          AND status IN ('submitted', 'pending_approval', 'approved')
          AND type IN ('expense', 'income')
          AND entry_date >= ${ymdToDate(monthsStart)}::date
          AND entry_date <= ${ymdToDate(today)}::date
        GROUP BY 1, 2`,
      prisma.pettyCashEntry.findMany({
        where: base,
        include: entryInclude,
        orderBy: [{ entryDate: "desc" }, { createdAt: "desc" }],
        take: 8,
      }),
    ]);

  // Trend: one point per day, zero-filled.
  const byDay = new Map(trendRows.map((r) => [dateToYmd(r.entryDate), num(r._sum.amount)]));
  const trend = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = addDays(trendStart, i);
    return { date, amount: byDay.get(date) ?? 0 };
  });

  // Category names for the breakdown (null = uncategorised).
  const categoryIds = categoryRows.map((r) => r.categoryId).filter((id): id is string => Boolean(id));
  const categories = categoryIds.length
    ? await prisma.category.findMany({ where: { companyId: auth.companyId, id: { in: categoryIds } }, select: { id: true, name: true } })
    : [];
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const categoryBreakdown = categoryRows
    .map((r) => ({ name: r.categoryId ? (names.get(r.categoryId) ?? "Unknown") : "Uncategorised", amount: num(r._sum.amount) }))
    .sort((a, b) => b.amount - a.amount);

  const paymentBreakdown = PAYMENT_METHODS.map((method) => ({
    method,
    amount: num(paymentRows.find((r) => r.paymentMethod === method)?._sum.amount),
  })).filter((p) => p.amount > 0);

  const monthly = Array.from({ length: MONTHS_BACK }, (_, i) => {
    const month = addMonths(monthsStart, i).slice(0, 7);
    const pick = (type: string) => num(monthlyRows.find((r) => r.month === month && r.type === type)?.total);
    return { month, expense: pick("expense"), income: pick("income") };
  });

  return {
    currency: settings.currency,
    timezone: settings.timezone,
    today,
    cashBalance,
    cashAccounts: accounts.map((a) => ({ id: a.id, name: a.name, balance: money(a.currentBalance) })),
    todayExpenses: money(todaySum._sum.amount),
    monthExpenses: money(monthSum._sum.amount),
    monthIncome: money(monthIncome._sum.amount),
    pendingApprovals: { count: pendingCount, amount: money(pendingExpense._sum.amount) },
    totalTransactions: total,
    activeUsers,
    trend,
    categoryBreakdown,
    paymentBreakdown,
    monthly,
    recent: recent.map((e) => toEntryDTO(e, auth)),
  };
}
