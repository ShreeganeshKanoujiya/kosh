import "server-only";
import type { ReportDTO } from "@/types/dto";
import type { ExportFormat } from "@/validators/export.schema";
import { toCsv } from "./csv";
import { toPdf } from "./pdf";
import type { ExportMeta } from "./shared";
import { toXlsx } from "./xlsx";

export type { ExportMeta } from "./shared";

export interface ExportFile {
  body: Uint8Array<ArrayBuffer>;
  contentType: string;
  filename: string;
}

const CONTENT_TYPES: Record<ExportFormat, string> = {
  csv: "text/csv; charset=utf-8",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
};

/** One table in, one file out — every format renders the same ReportDTO the screen shows. */
export async function renderExport(format: ExportFormat, report: ReportDTO, meta: ExportMeta, basename: string): Promise<ExportFile> {
  const data =
    format === "csv" ? Buffer.from(toCsv(report), "utf8") : format === "xlsx" ? await toXlsx(report, meta) : await toPdf(report, meta);
  return { body: new Uint8Array(data), contentType: CONTENT_TYPES[format], filename: `${basename}.${format}` };
}
