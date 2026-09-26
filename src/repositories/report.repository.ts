import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { ymdToDate } from "@/lib/dates";
import { prisma } from "@/lib/db/prisma";
import type { ReportQuery } from "@/validators/report.schema";

// All report SQL is built from Prisma.sql fragments: values are always bound parameters,
// never string-concatenated. Every query is scoped by company_id and excludes soft-deletes.

type D = Prisma.Decimal | null;

function filters(companyId: string, q: ReportQuery, alias = "e") {
  const col = (c: string) => Prisma.raw(`${alias}.${c}`);
  const conds: Prisma.Sql[] = [
    Prisma.sql`${col("company_id")} = ${companyId}::uuid`,
    Prisma.sql`${col("deleted_at")} IS NULL`,
    Prisma.sql`${col("entry_date")} >= ${ymdToDate(q.from)}::date`,
    Prisma.sql`${col("entry_date")} <= ${ymdToDate(q.to)}::date`,
  ];
  if (q.type !== "approval") {
    const statuses = q.status?.length ? q.status : q.basis === "approved" ? ["approved"] : ["submitted", "pending_approval", "approved"];
    conds.push(Prisma.sql`${col("status")}::text IN (${Prisma.join(statuses)})`);
  }
  if (q.categoryId) conds.push(Prisma.sql`${col("category_id")} = ${q.categoryId}::uuid`);
  if (q.userId) conds.push(Prisma.sql`${col("created_by")} = ${q.userId}::uuid`);
  if (q.paymentMethod) conds.push(Prisma.sql`${col("payment_method")}::text = ${q.paymentMethod}`);
  if (q.cashAccountId) conds.push(Prisma.sql`${col("cash_account_id")} = ${q.cashAccountId}::uuid`);
  return Prisma.join(conds, " AND ");
}

const SUMS = Prisma.sql`
  COUNT(*)::int AS count,
  COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense,
  COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
  COALESCE(SUM(amount) FILTER (WHERE type = 'adjustment'), 0) AS adjustment`;

export interface PeriodRow {
  period: Date;
  count: number;
  expense: D;
  income: D;
  adjustment: D;
}

export const reportRepository = {
  byPeriod(companyId: string, q: ReportQuery, unit: "day" | "week" | "month") {
    // date_trunc('week') starts weeks on Monday (ISO).
    return prisma.$queryRaw<PeriodRow[]>`
      SELECT date_trunc(${unit}, e.entry_date)::date AS period, ${SUMS}
      FROM petty_cash_entries e
      WHERE ${filters(companyId, q)}
      GROUP BY 1 ORDER BY 1`;
  },

  byCategory(companyId: string, q: ReportQuery) {
    return prisma.$queryRaw<{ name: string | null; count: number; expense: D; income: D; adjustment: D }[]>`
      SELECT c.name AS name, ${SUMS}
      FROM petty_cash_entries e
      LEFT JOIN categories c ON c.id = e.category_id AND c.company_id = e.company_id
      WHERE ${filters(companyId, q)}
      GROUP BY c.name ORDER BY expense DESC NULLS LAST, name`;
  },

  byUser(companyId: string, q: ReportQuery) {
    return prisma.$queryRaw<{ name: string; username: string; count: number; expense: D; income: D; adjustment: D }[]>`
      SELECT u.full_name AS name, u.username AS username, ${SUMS}
      FROM petty_cash_entries e
      JOIN users u ON u.id = e.created_by AND u.company_id = e.company_id
      WHERE ${filters(companyId, q)}
      GROUP BY u.full_name, u.username ORDER BY expense DESC, name`;
  },

  byPaymentMethod(companyId: string, q: ReportQuery) {
    return prisma.$queryRaw<{ method: string; count: number; expense: D; income: D; adjustment: D }[]>`
      SELECT e.payment_method::text AS method, ${SUMS}
      FROM petty_cash_entries e
      WHERE ${filters(companyId, q)}
      GROUP BY 1 ORDER BY expense DESC`;
  },

  /** Movement inside the range plus the account's current (all-time) approved balance. */
  byCashAccount(companyId: string, q: ReportQuery) {
    return prisma.$queryRaw<
      { name: string; opening: D; current: D; count: number; expense: D; income: D; adjustment: D }[]
    >`
      SELECT a.name AS name, a.opening_balance AS opening, a.current_balance AS current,
             COUNT(e.id)::int AS count,
             COALESCE(SUM(e.amount) FILTER (WHERE e.type = 'expense'), 0) AS expense,
             COALESCE(SUM(e.amount) FILTER (WHERE e.type = 'income'), 0) AS income,
             COALESCE(SUM(e.amount) FILTER (WHERE e.type = 'adjustment'), 0) AS adjustment
      FROM cash_accounts a
      LEFT JOIN petty_cash_entries e ON e.cash_account_id = a.id AND e.company_id = a.company_id AND ${filters(companyId, q)}
      WHERE a.company_id = ${companyId}::uuid
      ${q.cashAccountId ? Prisma.sql`AND a.id = ${q.cashAccountId}::uuid` : Prisma.empty}
      GROUP BY a.id, a.name, a.opening_balance, a.current_balance
      ORDER BY a.name`;
  },

  /** Decisions per reviewer (approvals + rejections) and how long entries waited. */
  approvals(companyId: string, q: ReportQuery) {
    return prisma.$queryRaw<
      { name: string; approved: number; rejected: number; approved_amount: D; avg_hours: number | null }[]
    >`
      WITH decisions AS (
        SELECT e.approved_by AS reviewer, 'approved' AS decision, e.amount, e.submitted_at, e.approved_at AS decided_at
        FROM petty_cash_entries e
        WHERE ${filters(companyId, q)} AND e.status = 'approved' AND e.auto_approved = false AND e.approved_by IS NOT NULL
        UNION ALL
        SELECT e.rejected_by, 'rejected', e.amount, e.submitted_at, e.rejected_at
        FROM petty_cash_entries e
        WHERE ${filters(companyId, q)} AND e.status = 'rejected' AND e.rejected_by IS NOT NULL
      )
      SELECT u.full_name AS name,
             COUNT(*) FILTER (WHERE d.decision = 'approved')::int AS approved,
             COUNT(*) FILTER (WHERE d.decision = 'rejected')::int AS rejected,
             COALESCE(SUM(d.amount) FILTER (WHERE d.decision = 'approved'), 0) AS approved_amount,
             AVG(EXTRACT(EPOCH FROM (d.decided_at - d.submitted_at)) / 3600)::float AS avg_hours
      FROM decisions d
      JOIN users u ON u.id = d.reviewer AND u.company_id = ${companyId}::uuid
      GROUP BY u.full_name ORDER BY approved DESC, name`;
  },

  statusCounts(companyId: string, q: ReportQuery) {
    return prisma.$queryRaw<{ status: string; count: number; amount: D }[]>`
      SELECT e.status::text AS status, COUNT(*)::int AS count, COALESCE(SUM(e.amount), 0) AS amount
      FROM petty_cash_entries e
      WHERE ${filters(companyId, q)}
      GROUP BY 1`;
  },
};
