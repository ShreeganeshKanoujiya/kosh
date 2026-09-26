import "server-only";
import { ENTRY_TYPE_LABELS, PAYMENT_METHOD_LABELS, STATUS_LABELS } from "@/config/entries";
import { AppError } from "@/lib/api/errors";
import { assertPermission } from "@/lib/auth/session";
import { dateToYmd, todayYmd } from "@/lib/dates";
import { renderExport, type ExportFile, type ExportMeta } from "@/lib/export";
import { slug } from "@/lib/export/shared";
import { formatCurrency, formatDate } from "@/lib/format";
import { Decimal, money } from "@/lib/money";
import type { RequestMeta } from "@/lib/security/request-meta";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { entryRepository } from "@/repositories/entry.repository";
import { settingsRepository } from "@/repositories/settings.repository";
import type { AuthContext } from "@/types/auth";
import type { ReportColumn, ReportDTO } from "@/types/dto";
import type { ListEntriesQuery } from "@/validators/entry.schema";
import type { ExportFormat, ExportSource } from "@/validators/export.schema";
import type { ReportQuery } from "@/validators/report.schema";
import { AUDIT_ACTIONS, recordAudit, type AuditAction } from "./audit.service";
import { buildReport, describeFilters } from "./report.service";

/** One export is capped so memory and PDF rendering time stay bounded; beyond this, narrow the filters. */
export const EXPORT_MAX_ROWS = 10_000;

/** The column set the spec asks exports (and Google Sheets) to preserve, plus a few accounting extras. */
const TRANSACTION_COLUMNS: ReportColumn[] = [
  { key: "entryDate", label: "Date", kind: "date" },
  { key: "entryTime", label: "Time", kind: "text" },
  { key: "entryNumber", label: "Entry no.", kind: "text" },
  { key: "type", label: "Type", kind: "text" },
  { key: "description", label: "Description", kind: "text" },
  { key: "category", label: "Category", kind: "text" },
  { key: "amount", label: "Amount", kind: "money" },
  { key: "paymentMethod", label: "Payment method", kind: "text" },
  { key: "merchantName", label: "Merchant", kind: "text" },
  { key: "upiId", label: "UPI ID", kind: "text" },
  { key: "transactionId", label: "Transaction ID", kind: "text" },
  { key: "referenceNumber", label: "Reference no.", kind: "text" },
  { key: "cashAccount", label: "Cash account", kind: "text" },
  { key: "createdBy", label: "Created by", kind: "text" },
  { key: "status", label: "Status", kind: "text" },
];

export function exportMeta(auth: AuthContext, timezone: string): ExportMeta {
  return {
    companyName: auth.company.name,
    generatedBy: auth.user.fullName,
    generatedAt: new Intl.DateTimeFormat("en-IN", {
      timeZone: timezone,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date()),
  };
}

/** Every entry matching the transactions screen's filters, as a generic table. */
export async function buildTransactionsTable(auth: AuthContext, q: ListEntriesQuery, currency: string): Promise<ReportDTO> {
  assertPermission(auth, "transactions.read");
  const entries = await entryRepository.listForExport(auth.companyId, q, EXPORT_MAX_ROWS + 1);
  if (entries.length > EXPORT_MAX_ROWS) {
    throw new AppError(
      "EXPORT_TOO_LARGE",
      `More than ${EXPORT_MAX_ROWS.toLocaleString("en-IN")} entries match. Narrow the date range or filters and try again.`,
      422,
    );
  }

  const total = (type: string) => entries.filter((e) => e.type === type).reduce((s, e) => s.plus(e.amount), new Decimal(0));
  const range = q.from || q.to ? `${q.from ? formatDate(q.from) : "Beginning"} – ${q.to ? formatDate(q.to) : "today"}` : "All dates";
  const count = `${entries.length.toLocaleString("en-IN")} ${entries.length === 1 ? "entry" : "entries"}`;

  return {
    type: "transactions",
    title: "Transactions",
    subtitle: `${range} · ${count} · Spent ${formatCurrency(money(total("expense")), currency)} · Cash added ${formatCurrency(money(total("income")), currency)}`,
    currency,
    filters: await describeFilters(auth.companyId, q, currency),
    columns: TRANSACTION_COLUMNS,
    rows: entries.map((e) => ({
      entryDate: dateToYmd(e.entryDate),
      entryTime: e.entryTime,
      entryNumber: e.entryNumber,
      type: ENTRY_TYPE_LABELS[e.type],
      description: e.description,
      category: e.category?.name ?? null,
      amount: Number(money(e.amount)),
      paymentMethod: PAYMENT_METHOD_LABELS[e.paymentMethod],
      merchantName: e.merchantName,
      upiId: e.upiId,
      transactionId: e.transactionId,
      referenceNumber: e.referenceNumber,
      cashAccount: e.cashAccount.name,
      createdBy: e.createdBy.fullName,
      status: STATUS_LABELS[e.status],
    })),
    totals: null,
    chart: null,
    generatedAt: new Date().toISOString(),
  };
}

/** Exports are heavier than page loads; cap them per user. */
export function limitExports(auth: AuthContext) {
  return enforceRateLimit(
    `export:${auth.userId}`,
    { limit: 30, windowSeconds: 600 },
    "You've exported a lot in the last few minutes. Please wait a little and try again.",
  );
}

/** Every export is audited — who took which data out, in what format, with which filters. */
export function recordExport(
  auth: AuthContext,
  action: AuditAction,
  details: { source: ExportSource; format: ExportFormat | "google_sheets"; table: ReportDTO; extra?: Record<string, string | number | null> },
  meta: RequestMeta,
) {
  return recordAudit({
    companyId: auth.companyId,
    userId: auth.userId,
    action,
    entityType: "report",
    newValues: {
      source: details.source,
      format: details.format,
      title: details.table.title,
      range: details.table.subtitle,
      // Readable in the audit log screen: "Category: Travel · Status: Approved"
      ...(details.table.filters.length ? { filters: details.table.filters.map((f) => `${f.label}: ${f.value}`).join(" · ") } : {}),
      rows: details.table.rows.length,
      ...details.extra,
    },
    meta,
  });
}

export async function exportReport(auth: AuthContext, q: ReportQuery, format: ExportFormat, meta: RequestMeta): Promise<ExportFile> {
  assertPermission(auth, "reports.read", "reports.export");
  await limitExports(auth);
  const settings = await settingsRepository.get(auth.companyId);
  const report = await buildReport(auth, q);
  const file = await renderExport(format, report, exportMeta(auth, settings.timezone), `kosh-${slug(report.title)}-${q.from}-to-${q.to}`);
  await recordExport(auth, AUDIT_ACTIONS.reportExported, { source: "report", format, table: report, extra: { reportType: q.type } }, meta);
  return file;
}

export async function exportTransactions(auth: AuthContext, q: ListEntriesQuery, format: ExportFormat, meta: RequestMeta): Promise<ExportFile> {
  assertPermission(auth, "transactions.read", "reports.export");
  await limitExports(auth);
  const settings = await settingsRepository.get(auth.companyId);
  const table = await buildTransactionsTable(auth, q, settings.currency);
  const range = q.from && q.to ? `${q.from}-to-${q.to}` : todayYmd(settings.timezone);
  const file = await renderExport(format, table, exportMeta(auth, settings.timezone), `kosh-transactions-${range}`);
  await recordExport(auth, AUDIT_ACTIONS.reportExported, { source: "transactions", format, table }, meta);
  return file;
}
