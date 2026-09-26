import type { ReportCell, ReportColumn, ReportColumnKind, ReportDTO } from "@/types/dto";

/** Who / when, printed in the heading of every formatted export. */
export interface ExportMeta {
  companyName: string;
  generatedBy: string;
  /** Already formatted in the company's timezone, e.g. "26 Sep 2026, 2:05 pm". */
  generatedAt: string;
}

/** The lines under the title: range, filters, provenance. Shared by Excel, PDF and Google Sheets. */
export function headingLines(report: ReportDTO, meta: ExportMeta): string[] {
  return [
    report.subtitle,
    ...report.filters.map((f) => `${f.label}: ${f.value}`),
    `${meta.companyName} · Generated ${meta.generatedAt} by ${meta.generatedBy}`,
  ];
}

/**
 * A report cell resolved to a real type, shared by the machine-readable formats
 * (CSV, Excel, Google Sheets) so numbers stay numbers and dates stay dates.
 */
export type TypedCell =
  | { t: "empty" }
  | { t: "text"; v: string }
  | { t: "number"; v: number; style: "money" | "integer" | "decimal" }
  /** Calendar date at UTC midnight. */
  | { t: "date"; v: Date }
  /** First day of a month at UTC midnight (monthly report periods). */
  | { t: "month"; v: Date };

const YMD = /^\d{4}-\d{2}-\d{2}$/;
const YM = /^\d{4}-\d{2}$/;

export const isEmptyCell = (v: ReportCell | undefined) => v === null || v === undefined || v === "";

export function typedCell(value: ReportCell | undefined, kind: ReportColumnKind): TypedCell {
  if (isEmptyCell(value)) return { t: "empty" };
  switch (kind) {
    case "money":
    case "number":
    case "percent":
    case "duration": {
      const n = Number(value);
      if (!Number.isFinite(n)) return { t: "text", v: String(value) };
      return { t: "number", v: n, style: kind === "money" ? "money" : kind === "number" ? "integer" : "decimal" };
    }
    case "date":
      return typeof value === "string" && YMD.test(value) ? { t: "date", v: new Date(`${value}T00:00:00Z`) } : { t: "text", v: String(value) };
    default:
      return typeof value === "string" && YM.test(value) ? { t: "month", v: new Date(`${value}-01T00:00:00Z`) } : { t: "text", v: String(value) };
  }
}

/** Header with its unit, because the machine formats carry bare numbers ("Expenses (INR)"). */
export function columnHeader(column: ReportColumn, currency: string) {
  switch (column.kind) {
    case "money":
      return `${column.label} (${currency})`;
    case "percent":
      return `${column.label} (%)`;
    case "duration":
      return `${column.label} (hours)`;
    default:
      return column.label;
  }
}

/** Numeric columns are right-aligned in every format. */
export const isNumericKind = (kind: ReportColumnKind) => kind === "money" || kind === "number" || kind === "percent" || kind === "duration";

/** Excel / Google Sheets serial day number (days since 1899-12-30). */
export const toSerialDay = (d: Date) => d.getTime() / 86_400_000 + 25_569;

/** "report title" → "report-title", safe for filenames and sheet names. */
export function slug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
