import "server-only";
import type { ReportDTO } from "@/types/dto";
import { columnHeader, typedCell, type TypedCell } from "./shared";

// A text cell starting with one of these is treated as a formula by Excel / Sheets
// ("CSV injection"). Prefixing an apostrophe makes the spreadsheet show it as text.
const FORMULA_START = /^[=+\-@\t\r]/;

function csvText(cell: TypedCell): string {
  switch (cell.t) {
    case "empty":
      return "";
    case "number":
      return cell.style === "money" ? cell.v.toFixed(2) : cell.style === "decimal" ? cell.v.toFixed(1) : String(cell.v);
    case "date":
      return cell.v.toISOString().slice(0, 10);
    case "month":
      return cell.v.toISOString().slice(0, 7);
    case "text":
      return FORMULA_START.test(cell.v) ? `'${cell.v}` : cell.v;
  }
}

const quote = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/**
 * RFC 4180 CSV: header row + data (+ totals). Bare numbers and ISO dates so it
 * imports cleanly anywhere; the BOM makes Excel read it as UTF-8 (₹, names).
 */
export function toCsv(report: ReportDTO): string {
  const rows = report.totals ? [...report.rows, report.totals] : report.rows;
  const lines = [
    report.columns.map((c) => columnHeader(c, report.currency)),
    ...rows.map((row) => report.columns.map((c) => csvText(typedCell(row[c.key], c.kind)))),
  ];
  return `﻿${lines.map((line) => line.map(quote).join(",")).join("\r\n")}\r\n`;
}
