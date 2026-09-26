import "server-only";
import { columnHeader, headingLines, isNumericKind, toSerialDay, typedCell, type ExportMeta, type TypedCell } from "@/lib/export/shared";
import type { ReportDTO } from "@/types/dto";

type CellData = { userEnteredValue?: { stringValue: string } | { numberValue: number } };

// stringValue is always stored as text, never evaluated — no formula injection through exports.
function sheetCell(cell: TypedCell): CellData {
  switch (cell.t) {
    case "empty":
      return {};
    case "text":
      return { userEnteredValue: { stringValue: cell.v } };
    case "number":
      return { userEnteredValue: { numberValue: cell.v } };
    case "date":
    case "month":
      return { userEnteredValue: { numberValue: toSerialDay(cell.v) } };
  }
}

const NUMBER_PATTERNS = { money: "#,##0.00", integer: "#,##0", decimal: "0.0" } as const;
const MUTED = { red: 0.42, green: 0.45, blue: 0.5 };
const HEADER_FILL = { red: 0.945, green: 0.949, blue: 0.957 };

/** Rows per batchUpdate — keeps each request well under the Sheets API payload limit. */
const CHUNK_ROWS = 2_000;

/**
 * batchUpdate payloads that write a report into a new tab. The first batch creates the tab
 * and writes the heading, header, formats and first rows atomically; later batches append
 * the remaining rows in chunks.
 */
export function buildSheetBatches(report: ReportDTO, meta: ExportMeta, sheetId: number, title: string): object[][] {
  const cols = Math.max(report.columns.length, 1);
  const heading: CellData[][] = [
    [{ userEnteredValue: { stringValue: report.title } }],
    ...headingLines(report, meta).map((line) => [{ userEnteredValue: { stringValue: line } }]),
    [],
  ];
  const headerRow = heading.length;
  const firstDataRow = headerRow + 1;
  const typed = [...report.rows, ...(report.totals ? [report.totals] : [])].map((row) =>
    report.columns.map((c) => typedCell(row[c.key], c.kind)),
  );
  const data = typed.map((cells) => cells.map(sheetCell));
  const rowCount = firstDataRow + data.length;

  const range = (r0: number, r1: number, c0 = 0, c1 = cols) => ({
    sheetId,
    startRowIndex: r0,
    endRowIndex: r1,
    startColumnIndex: c0,
    endColumnIndex: c1,
  });
  const writeRows = (rowIndex: number, rows: CellData[][]) => ({
    updateCells: { start: { sheetId, rowIndex, columnIndex: 0 }, rows: rows.map((values) => ({ values })), fields: "userEnteredValue" },
  });

  const header = report.columns.map((c) => ({ userEnteredValue: { stringValue: columnHeader(c, report.currency) } }));
  const first: object[] = [
    {
      addSheet: {
        properties: { sheetId, title, gridProperties: { rowCount, columnCount: cols, frozenRowCount: firstDataRow } },
      },
    },
    writeRows(0, [...heading, header, ...data.slice(0, CHUNK_ROWS)]),
    {
      repeatCell: {
        range: range(0, 1, 0, 1),
        cell: { userEnteredFormat: { textFormat: { bold: true, fontSize: 14 } } },
        fields: "userEnteredFormat.textFormat",
      },
    },
    {
      repeatCell: {
        range: range(1, headerRow, 0, 1),
        cell: { userEnteredFormat: { textFormat: { foregroundColor: MUTED } } },
        fields: "userEnteredFormat.textFormat.foregroundColor",
      },
    },
    {
      repeatCell: {
        range: range(headerRow, headerRow + 1),
        cell: { userEnteredFormat: { textFormat: { bold: true }, backgroundColor: HEADER_FILL } },
        fields: "userEnteredFormat(textFormat,backgroundColor)",
      },
    },
  ];

  report.columns.forEach((c, i) => {
    // The column's number format comes from its first non-empty value (dates, months, money…).
    const sample = typed.find((cells) => cells[i].t !== "empty")?.[i];
    const numberFormat =
      sample?.t === "date"
        ? { type: "DATE", pattern: "dd mmm yyyy" }
        : sample?.t === "month"
          ? { type: "DATE", pattern: "mmm yyyy" }
          : sample?.t === "number"
            ? { type: "NUMBER", pattern: NUMBER_PATTERNS[sample.style] }
            : null;
    if (numberFormat && data.length) {
      first.push({
        repeatCell: { range: range(firstDataRow, rowCount, i, i + 1), cell: { userEnteredFormat: { numberFormat } }, fields: "userEnteredFormat.numberFormat" },
      });
    }
    if (isNumericKind(c.kind)) {
      first.push({
        repeatCell: {
          range: range(headerRow, headerRow + 1, i, i + 1),
          cell: { userEnteredFormat: { horizontalAlignment: "RIGHT" } },
          fields: "userEnteredFormat.horizontalAlignment",
        },
      });
    }
    // Fixed widths from content: autoResize would stretch column A to fit the long heading lines.
    const chars = Math.max(columnHeader(c, report.currency).length, ...typed.slice(0, 500).map((cells) => displayChars(cells[i])));
    first.push({
      updateDimensionProperties: {
        range: { sheetId, dimension: "COLUMNS", startIndex: i, endIndex: i + 1 },
        properties: { pixelSize: Math.min(360, Math.max(64, chars * 7 + 24)) },
        fields: "pixelSize",
      },
    });
  });
  if (report.totals) {
    first.push({
      repeatCell: { range: range(rowCount - 1, rowCount), cell: { userEnteredFormat: { textFormat: { bold: true } } }, fields: "userEnteredFormat.textFormat.bold" },
    });
  }

  const batches: object[][] = [first];
  for (let start = CHUNK_ROWS; start < data.length; start += CHUNK_ROWS) {
    batches.push([writeRows(firstDataRow + start, data.slice(start, start + CHUNK_ROWS))]);
  }
  return batches;
}

function displayChars(cell: TypedCell) {
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
