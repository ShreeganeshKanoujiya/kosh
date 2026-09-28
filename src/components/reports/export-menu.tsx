"use client";

import { Download, FileSpreadsheet, FileText, FileType } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Spinner } from "@/components/ui/spinner";
import { apiDownload, errorMessage } from "@/lib/api-client";
import { EXPORT_FORMAT_LABELS, EXPORT_FORMATS, type ExportFormat, type ExportSource } from "@/validators/export.schema";

const ICONS: Record<ExportFormat, typeof FileText> = { csv: FileText, xlsx: FileSpreadsheet, pdf: FileType };
const ENDPOINTS: Record<ExportSource, string> = { report: "/api/reports/export", transactions: "/api/transactions/export" };

/**
 * Export whatever the screen currently shows. `query` is the screen's own query string,
 * so the server re-runs exactly the same filters for the file.
 */
export function ExportMenu({ source, query }: { source: ExportSource; query: string }) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const download = async (format: ExportFormat) => {
    setBusy(format);
    try {
      const params = new URLSearchParams(query);
      params.set("format", format);
      await apiDownload(`${ENDPOINTS[source]}?${params}`);
      toast.success("Export completed ✓");
    } catch (error) {
      toast.error(errorMessage(error, "Unable to export. Please try again."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={busy !== null} aria-busy={busy !== null}>
          {busy ? <Spinner /> : <Download />}
          {busy ? "Exporting…" : "Export"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Uses the filters shown on screen</DropdownMenuLabel>
        {EXPORT_FORMATS.map((format) => {
          const Icon = ICONS[format];
          return (
            <DropdownMenuItem key={format} onSelect={() => download(format)} className="gap-3 py-2">
              <Icon className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{EXPORT_FORMAT_LABELS[format].label}</p>
                <p className="text-xs text-muted-foreground">{EXPORT_FORMAT_LABELS[format].hint}</p>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
