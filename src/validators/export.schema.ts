import { z } from "zod";

export const EXPORT_FORMATS = ["csv", "xlsx", "pdf"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const EXPORT_FORMAT_LABELS: Record<ExportFormat, { label: string; hint: string }> = {
  csv: { label: "CSV", hint: "Plain data for any spreadsheet" },
  xlsx: { label: "Excel", hint: "Formatted .xlsx workbook" },
  pdf: { label: "PDF", hint: "Print-ready document" },
};

/** Export routes take the same query string as the screen they export, plus the format. */
export const exportFormatQuerySchema = z.object({ format: z.enum(EXPORT_FORMATS) });

export const EXPORT_SOURCES = ["report", "transactions"] as const;
export type ExportSource = (typeof EXPORT_SOURCES)[number];
/** Named `dataset`, not `source`: the transactions screen already uses `source` as a filter. */
export const exportDatasetQuerySchema = z.object({ dataset: z.enum(EXPORT_SOURCES) });

export const connectSheetSchema = z.object({
  url: z.string().trim().min(1, "Paste the link to your Google Sheet").max(500),
});
export type ConnectSheetInput = z.input<typeof connectSheetSchema>;
