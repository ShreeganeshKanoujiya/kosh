import "server-only";
import { Prisma } from "@/generated/prisma/client";
import {
  ENTRY_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  SOURCE_LABELS,
  STATUS_LABELS,
  type EntrySourceValue,
  type EntryStatusValue,
  type EntryTypeValue,
  type PaymentMethodValue,
} from "@/config/entries";
import { assertPermission } from "@/lib/auth/session";
import { dateToYmd } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { cashAccountRepository } from "@/repositories/cash-account.repository";
import { categoryRepository } from "@/repositories/category.repository";
import { settingsRepository } from "@/repositories/settings.repository";
import { reportRepository } from "@/repositories/report.repository";
import { userRepository } from "@/repositories/user.repository";
import type { AuthContext } from "@/types/auth";
import type { ReportColumn, ReportDTO, ReportFilter } from "@/types/dto";
import { REPORT_LABELS, type ReportQuery } from "@/validators/report.schema";

const n = (d: Prisma.Decimal | null | undefined) => (d ? Number(d.toFixed(2)) : 0);
const sum = <T,>(rows: T[], pick: (r: T) => number) => Math.round(rows.reduce((s, r) => s + pick(r), 0) * 100) / 100;

const MONEY_COLUMNS: ReportColumn[] = [
  { key: "count", label: "Entries", kind: "number" },
  { key: "expense", label: "Expenses", kind: "money" },
  { key: "income", label: "Cash added", kind: "money" },
  { key: "net", label: "Net change", kind: "money" },
];

type MoneyRow = { count: number; expense: Prisma.Decimal | null; income: Prisma.Decimal | null; adjustment: Prisma.Decimal | null };

function moneyCells(r: MoneyRow) {
  const expense = n(r.expense);
  const income = n(r.income);
  const adjustment = n(r.adjustment);
  return { count: r.count, expense, income, net: Math.round((income + adjustment - expense) * 100) / 100 };
}

function moneyTotals(rows: ReturnType<typeof moneyCells>[], firstKey: string) {
  return {
    [firstKey]: "Total",
    count: sum(rows, (r) => r.count),
    expense: sum(rows, (r) => r.expense),
    income: sum(rows, (r) => r.income),
    net: sum(rows, (r) => r.net),
  };
}

function withShare<T extends { expense: number }>(rows: T[]) {
  const total = rows.reduce((s, r) => s + r.expense, 0);
  return rows.map((r) => ({ ...r, share: total ? Math.round((r.expense / total) * 1000) / 10 : 0 }));
}

function rangeLabel(q: ReportQuery) {
  const f = (ymd: string) =>
    new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${ymd}T00:00:00Z`));
  const basis = q.type === "approval" ? "" : q.basis === "approved" ? " · Approved entries" : " · All recorded entries";
  return `${f(q.from)} – ${f(q.to)}${basis}`;
}

export interface FilterSubject {
  search?: string;
  status?: string[];
  type?: EntryTypeValue;
  categoryId?: string;
  userId?: string;
  paymentMethod?: PaymentMethodValue;
  source?: EntrySourceValue;
  cashAccountId?: string;
  minAmount?: number;
  maxAmount?: number;
}

/** Human labels for the filters behind a report or export ("Category: Travel"), printed on every export. */
export async function describeFilters(companyId: string, f: FilterSubject, currency: string): Promise<ReportFilter[]> {
  const [category, user, account] = await Promise.all([
    f.categoryId ? categoryRepository.findById(companyId, f.categoryId) : null,
    f.userId ? userRepository.findById(companyId, f.userId) : null,
    f.cashAccountId ? cashAccountRepository.findById(companyId, f.cashAccountId) : null,
  ]);
  const amount = (v: number) => formatCurrency(v, currency);
  const out: ReportFilter[] = [];
  if (f.search) out.push({ label: "Search", value: `“${f.search}”` });
  if (f.status?.length) {
    out.push({ label: "Status", value: f.status.map((s) => STATUS_LABELS[s as EntryStatusValue] ?? s).join(", ") });
  }
  if (f.type) out.push({ label: "Type", value: ENTRY_TYPE_LABELS[f.type] });
  if (f.categoryId) out.push({ label: "Category", value: category?.name ?? "Unknown" });
  if (f.userId) out.push({ label: "Created by", value: user?.fullName ?? "Unknown" });
  if (f.paymentMethod) out.push({ label: "Payment method", value: PAYMENT_METHOD_LABELS[f.paymentMethod] });
  if (f.source) out.push({ label: "Source", value: SOURCE_LABELS[f.source] });
  if (f.cashAccountId) out.push({ label: "Cash account", value: account?.name ?? "Unknown" });
  if (f.minAmount !== undefined && f.maxAmount !== undefined) {
    out.push({ label: "Amount", value: `${amount(f.minAmount)} – ${amount(f.maxAmount)}` });
  } else if (f.minAmount !== undefined) {
    out.push({ label: "Amount", value: `at least ${amount(f.minAmount)}` });
  } else if (f.maxAmount !== undefined) {
    out.push({ label: "Amount", value: `up to ${amount(f.maxAmount)}` });
  }
  return out;
}

/**
 * Build any report as a generic table. The same ReportDTO feeds the screen,
 * CSV / Excel / PDF exports and Google Sheets — so exports always match what users see.
 */
export async function buildReport(auth: AuthContext, q: ReportQuery): Promise<ReportDTO> {
  assertPermission(auth, "reports.read");
  const settings = await settingsRepository.get(auth.companyId);
  const base = {
    type: q.type,
    title: REPORT_LABELS[q.type].title,
    subtitle: rangeLabel(q),
    currency: settings.currency,
    filters: await describeFilters(
      auth.companyId,
      { status: q.status, categoryId: q.categoryId, userId: q.userId, paymentMethod: q.paymentMethod, cashAccountId: q.cashAccountId },
      settings.currency,
    ),
    generatedAt: new Date().toISOString(),
  };

  switch (q.type) {
    case "daily":
    case "weekly":
    case "monthly": {
      const unit = q.type === "daily" ? "day" : q.type === "weekly" ? "week" : "month";
      const raw = await reportRepository.byPeriod(auth.companyId, q, unit);
      const rows = raw.map((r) => {
        const ymd = dateToYmd(r.period);
        return { period: unit === "month" ? ymd.slice(0, 7) : ymd, ...moneyCells(r) };
      });
      const label = unit === "day" ? "Date" : unit === "week" ? "Week starting" : "Month";
      return {
        ...base,
        columns: [{ key: "period", label, kind: unit === "month" ? "text" : "date" }, ...MONEY_COLUMNS],
        rows,
        totals: rows.length ? moneyTotals(rows, "period") : null,
        chart: { xKey: "period", yKey: "expense" },
      };
    }

    case "category": {
      const raw = await reportRepository.byCategory(auth.companyId, q);
      const rows = withShare(raw.map((r) => ({ category: r.name ?? "Uncategorised", ...moneyCells(r) })));
      return {
        ...base,
        columns: [
          { key: "category", label: "Category", kind: "text" },
          { key: "count", label: "Entries", kind: "number" },
          { key: "expense", label: "Expenses", kind: "money" },
          { key: "share", label: "Share of spend", kind: "percent" },
          { key: "income", label: "Cash added", kind: "money" },
        ],
        rows,
        totals: rows.length ? { ...moneyTotals(rows, "category"), share: 100 } : null,
        chart: null,
      };
    }

    case "user": {
      const raw = await reportRepository.byUser(auth.companyId, q);
      const rows = withShare(raw.map((r) => ({ user: `${r.name} (@${r.username})`, ...moneyCells(r) })));
      return {
        ...base,
        columns: [
          { key: "user", label: "User", kind: "text" },
          { key: "count", label: "Entries", kind: "number" },
          { key: "expense", label: "Expenses", kind: "money" },
          { key: "share", label: "Share of spend", kind: "percent" },
          { key: "income", label: "Cash added", kind: "money" },
        ],
        rows,
        totals: rows.length ? { ...moneyTotals(rows, "user"), share: 100 } : null,
        chart: null,
      };
    }

    case "payment_method": {
      const raw = await reportRepository.byPaymentMethod(auth.companyId, q);
      const rows = withShare(
        raw.map((r) => ({ method: PAYMENT_METHOD_LABELS[r.method as PaymentMethodValue] ?? r.method, ...moneyCells(r) })),
      );
      return {
        ...base,
        columns: [
          { key: "method", label: "Payment method", kind: "text" },
          { key: "count", label: "Entries", kind: "number" },
          { key: "expense", label: "Expenses", kind: "money" },
          { key: "share", label: "Share of spend", kind: "percent" },
          { key: "income", label: "Cash added", kind: "money" },
        ],
        rows,
        totals: rows.length ? { ...moneyTotals(rows, "method"), share: 100 } : null,
        chart: null,
      };
    }

    case "cash_account": {
      assertPermission(auth, "cash_accounts.read");
      const raw = await reportRepository.byCashAccount(auth.companyId, q);
      const rows = raw.map((r) => ({
        account: r.name,
        ...moneyCells(r),
        opening: n(r.opening),
        current: n(r.current),
      }));
      return {
        ...base,
        subtitle: `${base.subtitle} · Balances are all-time`,
        columns: [
          { key: "account", label: "Cash account", kind: "text" },
          { key: "opening", label: "Opening balance", kind: "money" },
          { key: "income", label: "Cash added", kind: "money" },
          { key: "expense", label: "Expenses", kind: "money" },
          { key: "net", label: "Net in range", kind: "money" },
          { key: "current", label: "Current balance", kind: "money" },
        ],
        rows,
        totals: rows.length
          ? {
              account: "Total",
              opening: sum(rows, (r) => r.opening),
              income: sum(rows, (r) => r.income),
              expense: sum(rows, (r) => r.expense),
              net: sum(rows, (r) => r.net),
              current: sum(rows, (r) => r.current),
            }
          : null,
        chart: null,
      };
    }

    case "approval": {
      const [reviewers, statuses] = await Promise.all([
        reportRepository.approvals(auth.companyId, q),
        reportRepository.statusCounts(auth.companyId, q),
      ]);
      const pending = statuses
        .filter((s) => s.status === "submitted" || s.status === "pending_approval")
        .reduce((acc, s) => acc + s.count, 0);
      const rows = reviewers.map((r) => ({
        reviewer: r.name,
        approved: r.approved,
        rejected: r.rejected,
        approvedAmount: n(r.approved_amount),
        avgHours: r.avg_hours === null ? null : Math.round(r.avg_hours * 10) / 10,
      }));
      const byStatus = statuses
        .map((s) => `${STATUS_LABELS[s.status as EntryStatusValue] ?? s.status}: ${s.count}`)
        .join(" · ");
      return {
        ...base,
        subtitle: `${base.subtitle}${byStatus ? ` · ${byStatus}` : ""}${pending ? ` · ${pending} awaiting review` : ""}`,
        columns: [
          { key: "reviewer", label: "Reviewer", kind: "text" },
          { key: "approved", label: "Approved", kind: "number" },
          { key: "rejected", label: "Rejected", kind: "number" },
          { key: "approvedAmount", label: "Amount approved", kind: "money" },
          { key: "avgHours", label: "Avg. time to decide", kind: "duration" },
        ],
        rows,
        totals: rows.length
          ? {
              reviewer: "Total",
              approved: sum(rows, (r) => r.approved),
              rejected: sum(rows, (r) => r.rejected),
              approvedAmount: sum(rows, (r) => r.approvedAmount),
              avgHours: null,
            }
          : null,
        chart: null,
      };
    }
  }
}
