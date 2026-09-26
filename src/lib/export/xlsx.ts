import "server-only";
import writeXlsxFile, { type CellObject, type Row } from "write-excel-file/node";
import type { ReportDTO } from "@/types/dto";
import { columnHeader, headingLines, isNumericKind, typedCell, type ExportMeta, type TypedCell } from "./shared";

const NUMBER_FORMATS = { money: "#,##0.00", integer: "#,##0", decimal: "0.0" } as const;
const MUTED = "#6B7280";
const HEADER_FILL = "#F1F2F4";

// Typed String cells are always written as text, never formulas — no injection risk here.
function xlsxCell(cell: TypedCell): CellObject | null {
  switch (cell.t) {
    case "empty":
      return null;
    case "text":
      return { type: String, value: cell.v };
    case "number":
      return { type: Number, value: cell.v, format: NUMBER_FORMATS[cell.style] };
    case "date":
      return { type: Date, value: cell.v, format: "dd mmm yyyy" };
    case "month":
      return { type: Date, value: cell.v, format: "mmm yyyy" };
  }
}

/** Approximate rendered width in characters, for column sizing. */
function displayWidth(cell: TypedCell) {
  switch (cell.t) {
    case "empty":
      return 0;
    case "text":
      return cell.v.length;
    case "number":
      return cell.v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).length;
    case "date":
      return 11;
    case "month":
      return 8;
  }
}

/** Excel sheet names: max 31 characters, none of [ ] : * ? / \ */
const sheetName = (title: string) => title.replace(/[[\]:*?/\\]/g, " ").slice(0, 31) || "Report";

/** Formatted workbook: title + provenance, bold header, real numbers/dates, totals, frozen header. */
export async function toXlsx(report: ReportDTO, meta: ExportMeta): Promise<Buffer> {
  const typed = report.rows.map((row) => report.columns.map((c) => typedCell(row[c.key], c.kind)));

  const heading: Row[] = [
    [{ type: String, value: report.title, fontWeight: "bold", fontSize: 14 }],
    ...headingLines(report, meta).map((line): Row => [{ type: String, value: line, textColor: MUTED }]),
    [null],
  ];
  const header: Row = report.columns.map((c) => ({
    type: String,
    value: columnHeader(c, report.currency),
    fontWeight: "bold",
    backgroundColor: HEADER_FILL,
    bottomBorderStyle: "thin",
    align: isNumericKind(c.kind) ? "right" : "left",
  }));
  const body: Row[] = typed.map((cells) => cells.map(xlsxCell));
  const totals: Row[] = report.totals
    ? [report.columns.map((c) => ({ ...xlsxCell(typedCell(report.totals![c.key], c.kind)), fontWeight: "bold", topBorderStyle: "thin" }))]
    : [];

  const sample = typed.slice(0, 500);
  const columns = report.columns.map((c, i) => ({
    width: Math.min(48, Math.max(8, columnHeader(c, report.currency).length, ...sample.map((cells) => displayWidth(cells[i]))) + 2),
  }));

  return writeXlsxFile([...heading, header, ...body, ...totals], {
    sheet: sheetName(report.title),
    columns,
    stickyRowsCount: heading.length + 1,
  }).toBuffer();
}
