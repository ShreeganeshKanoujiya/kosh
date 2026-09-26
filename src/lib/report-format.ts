import type { ReportCell, ReportColumnKind } from "@/types/dto";
import { formatCurrency, formatDate, formatNumber } from "./format";

/** Human formatting for a report cell — shared by the screen and the PDF export. */
export function formatReportCell(value: ReportCell, kind: ReportColumnKind, currency: string): string {
  if (value === null || value === undefined || value === "") return "—";
  switch (kind) {
    case "money":
      return formatCurrency(Number(value), currency);
    case "number":
      return formatNumber(Number(value));
    case "percent":
      return `${Number(value).toFixed(1)}%`;
    case "duration": {
      const h = Number(value);
      return h < 24 ? `${h.toFixed(1)} h` : `${(h / 24).toFixed(1)} days`;
    }
    case "date":
      return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatDate(value) : String(value);
    default:
      return typeof value === "string" && /^\d{4}-\d{2}$/.test(value)
        ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}-01T00:00:00Z`))
        : String(value);
  }
}
