"use client";

import { AlertTriangle, CheckCircle2, ImageUp, Info, RotateCcw, ScanLine } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { AttachmentViewer } from "@/components/attachments/attachment-viewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IMAGE_ACCEPT } from "@/config/attachments";
import type { EntryTypeValue } from "@/config/entries";
import { api, errorMessage } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/format";
import { prepareImageForUpload } from "@/lib/image-prepare";
import { LOW_CONFIDENCE, UPI_FIELDS } from "@/lib/ocr/upi-parser";
import { cn } from "@/lib/utils";
import type { CashAccountDTO, CategoryDTO, UpiScanDTO } from "@/types/dto";
import { EntryForm, type EntryFormSettings } from "./entry-form";

type Step = { name: "pick" } | { name: "reading"; preview: string } | { name: "review"; preview: string; scan: UpiScanDTO };

/**
 * Upload screenshot → read it on the server → review. Every detected value lands in the normal
 * entry form for the user to confirm or correct; nothing is saved until they press Save.
 */
export function ScanUpi({
  categories,
  cashAccounts,
  settings,
  canAdjust,
}: {
  categories: CategoryDTO[];
  cashAccounts: CashAccountDTO[];
  settings: EntryFormSettings;
  canAdjust: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>({ name: "pick" });
  const [dragging, setDragging] = useState(false);
  const [zoom, setZoom] = useState(false);

  // Free the local preview when it's replaced or the screen closes.
  const preview = step.name === "pick" ? null : step.preview;
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function scan(original: File) {
    if (!original.type.startsWith("image/")) {
      toast.error("Choose a screenshot image (JPG, PNG or WebP).");
      return;
    }
    const localPreview = URL.createObjectURL(original);
    setStep({ name: "reading", preview: localPreview });
    try {
      const file = await prepareImageForUpload(original, { maxEdge: 3000, softLimit: 3.5 * 1024 * 1024 });
      const form = new FormData();
      form.set("file", file);
      const { data } = await api<UpiScanDTO>("/api/ocr/upi", { method: "POST", body: form });
      setStep({ name: "review", preview: localPreview, scan: data });
      if (data.extraction) toast.success("Screenshot processed ✓");
    } catch (error) {
      setStep({ name: "pick" });
      toast.error(errorMessage(error, "Unable to process the screenshot. Please try again."));
    }
  }

  const onFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) void scan(file);
  };

  if (step.name === "pick") {
    return (
      <Card
        className={cn(
          "mx-auto max-w-2xl items-center gap-5 border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging && "border-primary bg-accent/40",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          onFiles(e.dataTransfer.files);
        }}
      >
        <input ref={input} type="file" accept={IMAGE_ACCEPT} hidden onChange={(e) => onFiles(e.target.files)} />
        <span className="inline-flex size-16 items-center justify-center rounded-3xl bg-accent text-accent-foreground">
          <ScanLine className="size-8" aria-hidden />
        </span>
        <div className="space-y-1">
          <h2 className="text-section-title">Scan a UPI screenshot</h2>
          <p className="text-caption mx-auto max-w-sm">
            Google Pay, PhonePe, Paytm, BHIM or your bank app. Kosh reads the amount, date, payee and transaction ID — you check them before
            saving.
          </p>
        </div>
        <Button size="lg" onClick={() => input.current?.click()}>
          <ImageUp />
          Choose screenshot
        </Button>
        <p className="text-meta hidden md:block">or drop the image here</p>
        <Link href="/transactions/new?mode=manual" className="touch-hitbox relative text-sm text-primary underline-offset-4 hover:underline">
          Enter manually instead
        </Link>
      </Card>
    );
  }

  if (step.name === "reading") {
    return (
      <Card className="mx-auto max-w-md items-center gap-5 p-6 text-center" aria-busy="true">
        <div className="relative w-full max-w-60 overflow-hidden rounded-2xl border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={step.preview} alt="Your screenshot" className="max-h-[50dvh] w-full object-contain opacity-80" />
          <span className="absolute inset-x-0 h-12 -translate-y-1/2 animate-scan bg-gradient-to-b from-transparent via-primary/35 to-transparent motion-reduce:hidden" aria-hidden />
        </div>
        <p role="status" className="text-sm font-medium">
          Reading screenshot…
        </p>
      </Card>
    );
  }

  const { scan: result } = step;
  const x = result.extraction;
  const lowCount = x ? UPI_FIELDS.filter((f) => x.fields[f].value && x.fields[f].confidence < LOW_CONFIDENCE).length : 0;
  const prefill = x
    ? {
        type: (x.direction === "received" ? "income" : "expense") as EntryTypeValue,
        paymentMethod: "upi" as const,
        // A time the scan couldn't read stays empty rather than looking like "now" was read.
        entryTime: "",
        ...Object.fromEntries(UPI_FIELDS.flatMap((f) => (x.fields[f].value ? [[f, x.fields[f].value]] : []))),
      }
    : { paymentMethod: "upi" as const };

  return (
    <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-6">
      <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div
          className={cn(
            "flex items-start gap-3 rounded-2xl border p-4",
            x ? "border-success/30 bg-success/5" : "border-warning/40 bg-warning/10",
          )}
          role="status"
        >
          {x ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden /> : <Info className="mt-0.5 size-5 shrink-0" aria-hidden />}
          <div className="space-y-0.5 text-sm">
            <p className="font-semibold">{x ? "Transaction detected" : "Couldn't read the details"}</p>
            <p className="text-muted-foreground">
              {x
                ? `${x.app ? `${x.app} · ` : ""}${lowCount ? `${lowCount} field${lowCount === 1 ? "" : "s"} to check` : "Check the details, then save"}`
                : result.message}
            </p>
          </div>
        </div>

        {x && x.status !== "success" && x.status !== "unknown" && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm" role="alert">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <p>
              This payment shows as <strong>{x.status}</strong>. Record it only once it has gone through.
            </p>
          </div>
        )}

        {(result.sameScreenshot.length > 0 || result.duplicates.length > 0) && (
          <div className="space-y-2 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm" role="alert">
            <p className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4" aria-hidden />
              Possible duplicate
            </p>
            {result.sameScreenshot.length > 0 && <p>This exact screenshot is already attached to:</p>}
            <ul className="space-y-1">
              {result.sameScreenshot.map((e) => (
                <li key={e.id}>
                  <Link href={`/transactions/${e.id}`} className="font-mono text-primary underline-offset-4 hover:underline">
                    {e.entryNumber}
                  </Link>
                </li>
              ))}
              {result.duplicates
                .filter((d) => !result.sameScreenshot.some((s) => s.id === d.id))
                .map((d) => (
                  <li key={d.id}>
                    <Link href={`/transactions/${d.id}`} className="font-mono text-primary underline-offset-4 hover:underline">
                      {d.entryNumber}
                    </Link>{" "}
                    · {formatCurrency(d.amount)} · {formatDate(d.entryDate)}
                  </li>
                ))}
            </ul>
          </div>
        )}

        <button
          type="button"
          onClick={() => setZoom(true)}
          className="block w-full overflow-hidden rounded-2xl border bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          aria-label="View the original screenshot"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
          <img src={step.preview} alt="" className="max-h-56 w-full object-contain lg:max-h-[60dvh]" />
        </button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => {
            // The unused screenshot would be cleaned up eventually; remove it now.
            void api(`/api/attachments/${result.attachment.id}`, { method: "DELETE" }).catch(() => undefined);
            setStep({ name: "pick" });
          }}
        >
          <RotateCcw />
          Scan a different screenshot
        </Button>
      </aside>

      <EntryForm
        key={result.attachment.id}
        categories={categories}
        cashAccounts={cashAccounts}
        settings={settings}
        canAdjust={canAdjust}
        prefill={prefill}
        detected={x?.fields}
        source="upi_screenshot"
        initialAttachments={[result.attachment]}
      />

      <AttachmentViewer attachment={zoom ? result.attachment : null} onOpenChange={(open) => !open && setZoom(false)} />
    </div>
  );
}
