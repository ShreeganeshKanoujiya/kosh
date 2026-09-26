import "server-only";
import PDFDocument from "pdfkit";
import { formatReportCell } from "@/lib/report-format";
import type { ReportCell, ReportColumnKind, ReportDTO } from "@/types/dto";
import { pdfFonts } from "./fonts";
import { headingLines, isEmptyCell, isNumericKind, type ExportMeta } from "./shared";

const REGULAR = "inter-regular";
const SEMIBOLD = "inter-semibold";

const TEXT = "#111827";
const MUTED = "#6B7280";
const HEADER_FILL = "#F1F2F4";
const STRIPE = "#F8F9FA";
const MARGIN = { top: 40, bottom: 44, left: 36, right: 36 };
const PAD_X = 4;
const PAD_Y = 3.5;
const MIN_TEXT_WIDTH = 48;

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * Print-ready table: title + provenance heading, header row repeated on every page,
 * zebra rows, totals, "Page x of y" footer. Landscape when the table is wide.
 */
export async function toPdf(report: ReportDTO, meta: ExportMeta): Promise<Buffer> {
  // Paper has a fixed width: drop columns that are empty in every row (e.g. no reference numbers).
  const columns = report.columns.filter(
    (c, i) => i === 0 || report.rows.some((r) => !isEmptyCell(r[c.key])) || (report.totals && !isEmptyCell(report.totals[c.key])),
  );
  const show = (value: ReportCell | undefined, kind: ReportColumnKind) =>
    isEmptyCell(value) ? "" : formatReportCell(value as ReportCell, kind, report.currency);

  const headers = columns.map((c) => c.label);
  const rows = report.rows.map((row) => columns.map((c) => show(row[c.key], c.kind)));
  const totals = report.totals ? columns.map((c, i) => (i === 0 ? "Total" : show(report.totals![c.key], c.kind))) : null;
  const rightAligned = columns.map((c, i) => i > 0 && isNumericKind(c.kind));
  // Only free text may wrap; dates and numbers keep their natural width.
  const wraps = columns.map((c) => c.kind === "text");

  const landscape = columns.length > 6;
  const fontSize = columns.length > 10 ? 7.5 : 8.5;

  const doc = new PDFDocument({
    size: "A4",
    layout: landscape ? "landscape" : "portrait",
    margins: MARGIN,
    bufferPages: true,
    // No default font: pdfkit would load Helvetica, and a pre-loaded copy of Inter stops
    // pdfkit from caching the registered name (it would re-parse the TTF on every font() call).
    font: null as unknown as string,
    info: { Title: report.title, Author: meta.companyName, Creator: "Kosh" },
  });
  const fonts = pdfFonts();
  doc.registerFont(REGULAR, fonts.regular);
  doc.registerFont(SEMIBOLD, fonts.semibold);

  const chunks: Buffer[] = [];
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const left = MARGIN.left;
  const tableWidth = doc.page.width - MARGIN.left - MARGIN.right;
  const pageBottom = () => doc.page.height - MARGIN.bottom - 1;

  // ── Column widths ────────────────────────────────────────────────────────
  // natural = everything on one line; minimum = never break inside a word (numbers and dates never wrap).
  const measure = (font: string, text: string) => doc.font(font).fontSize(fontSize).widthOfString(text);
  const longestWord = (font: string, text: string) => Math.max(0, ...text.split(/\s+/).map((word) => measure(font, word)));
  const sample = totals ? [...rows.slice(0, 1000), totals] : rows.slice(0, 1000);
  const natural = headers.map((h, i) => Math.max(measure(SEMIBOLD, h), ...sample.map((r) => measure(REGULAR, r[i]))) + PAD_X * 2);
  const minimum = headers.map(
    (h, i) =>
      Math.max(
        longestWord(SEMIBOLD, h),
        ...sample.map((r) => (wraps[i] ? longestWord(REGULAR, r[i]) : measure(REGULAR, r[i]))),
        wraps[i] ? MIN_TEXT_WIDTH - PAD_X * 2 : 0,
      ) +
      PAD_X * 2,
  );
  let widths: number[];
  if (sum(natural) <= tableWidth) {
    // Everything fits on one line: spare room goes to the text columns so the table spans the page.
    const spare = tableWidth - sum(natural);
    const flex = sum(natural.filter((_, i) => wraps[i]));
    widths = natural.map((w, i) => (flex ? (wraps[i] ? w + (spare * w) / flex : w) : w + spare / natural.length));
  } else if (sum(minimum) <= tableWidth) {
    // Start every column at its minimum, then share the rest by how much more each one wants.
    const room = tableWidth - sum(minimum);
    const want = natural.map((w, i) => w - minimum[i]);
    widths = minimum.map((m, i) => m + (room * want[i]) / sum(want));
  } else {
    // Too many long words for the page — shrink proportionally (rare: very wide tables).
    widths = minimum.map((m) => (m * tableWidth) / sum(minimum));
  }

  // ── Rows ─────────────────────────────────────────────────────────────────
  const lineHeight = (font: string) => doc.font(font).fontSize(fontSize).heightOfString("Ag");
  const rowHeight = (texts: string[], font: string) => {
    const single = lineHeight(font);
    let h = single;
    texts.forEach((t, i) => {
      const inner = widths[i] - PAD_X * 2;
      // heightOfString is the slow path — only needed when the text can't fit on one line.
      if (t && doc.widthOfString(t) > inner) h = Math.max(h, doc.heightOfString(t, { width: inner }));
    });
    return h + PAD_Y * 2;
  };

  let y = 0;
  const drawRow = (texts: string[], font: string, height: number, fill?: string) => {
    if (fill) doc.rect(left, y, tableWidth, height).fill(fill);
    doc.font(font).fontSize(fontSize).fillColor(TEXT);
    let x = left;
    texts.forEach((t, i) => {
      if (t) doc.text(t, x + PAD_X, y + PAD_Y, { width: widths[i] - PAD_X * 2, align: rightAligned[i] ? "right" : "left" });
      x += widths[i];
    });
    y += height;
  };
  const headerHeight = rowHeight(headers, SEMIBOLD);
  const drawHeader = () => drawRow(headers, SEMIBOLD, headerHeight, HEADER_FILL);
  const ensureRoom = (height: number) => {
    if (y + height <= pageBottom()) return;
    doc.addPage();
    y = MARGIN.top;
    drawHeader();
  };

  // ── Heading (first page) ─────────────────────────────────────────────────
  doc.font(SEMIBOLD).fontSize(15).fillColor(TEXT).text(report.title, left, MARGIN.top, { width: tableWidth });
  doc.moveDown(0.3);
  doc.font(REGULAR).fontSize(8.5).fillColor(MUTED);
  for (const line of headingLines(report, meta)) doc.text(line, { width: tableWidth });
  y = doc.y + 12;

  if (rows.length === 0) {
    doc.font(REGULAR).fontSize(9).fillColor(MUTED).text("No entries match these filters.", left, y, { width: tableWidth });
  } else {
    drawHeader();
    rows.forEach((texts, r) => {
      const h = rowHeight(texts, REGULAR);
      ensureRoom(h);
      drawRow(texts, REGULAR, h, r % 2 === 1 ? STRIPE : undefined);
    });
    if (totals) {
      const h = rowHeight(totals, SEMIBOLD);
      ensureRoom(h);
      doc.moveTo(left, y).lineTo(left + tableWidth, y).lineWidth(0.75).strokeColor(TEXT).stroke();
      drawRow(totals, SEMIBOLD, h);
    }
  }

  // ── Footer on every page ────────────────────────────────────────────────
  const { start, count } = doc.bufferedPageRange();
  for (let i = 0; i < count; i++) {
    doc.switchToPage(start + i);
    // Writing inside the bottom margin would otherwise make pdfkit start a new page.
    doc.page.margins.bottom = 0;
    const fy = doc.page.height - MARGIN.bottom + 18;
    doc.font(REGULAR).fontSize(7.5).fillColor(MUTED);
    doc.text(`${meta.companyName} · ${report.title}`, left, fy, { width: tableWidth / 2, lineBreak: false });
    doc.text(`Page ${i + 1} of ${count}`, left + tableWidth / 2, fy, { width: tableWidth / 2, align: "right", lineBreak: false });
    doc.page.margins.bottom = MARGIN.bottom;
  }

  doc.end();
  return done;
}
