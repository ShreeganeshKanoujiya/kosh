"use client";

import { FileText, X } from "lucide-react";
import { useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { ATTACHMENT_KIND_LABELS } from "@/config/attachments";
import { cn } from "@/lib/utils";
import type { AttachmentDTO } from "@/types/dto";
import { AttachmentViewer } from "./attachment-viewer";

export interface PendingUpload {
  key: string;
  name: string;
}

/** Thumbnails of an entry's files; tap one to view it. */
export function AttachmentTiles({
  attachments,
  pending = [],
  onRemove,
  removing,
  compact,
  className,
}: {
  attachments: AttachmentDTO[];
  pending?: PendingUpload[];
  onRemove?: (attachment: AttachmentDTO) => void;
  removing?: string | null;
  /** Small fixed-size thumbnails without labels (cards, lists). */
  compact?: boolean;
  className?: string;
}) {
  const [viewing, setViewing] = useState<AttachmentDTO | null>(null);
  if (!attachments.length && !pending.length) return null;

  return (
    <>
      <ul className={cn(compact ? "flex flex-wrap gap-2" : "grid grid-cols-3 gap-2 sm:grid-cols-4", className)}>
        {attachments.map((a) => (
          <li key={a.id} className={cn("relative min-w-0", compact && "size-16")}>
            <button
              type="button"
              onClick={() => setViewing(a)}
              className="group block aspect-square w-full overflow-hidden rounded-xl border bg-muted outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={`View ${ATTACHMENT_KIND_LABELS[a.kind].toLowerCase()} ${a.fileName}`}
            >
              {a.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- access-checked API URL
                <img src={a.url} alt="" loading="lazy" className="size-full object-cover transition-transform duration-200 group-hover:scale-[1.03]" />
              ) : (
                <span className="flex size-full flex-col items-center justify-center gap-1 text-muted-foreground">
                  <FileText className="size-7" aria-hidden />
                  <span className="text-[0.6875rem] font-medium">PDF</span>
                </span>
              )}
            </button>
            {!compact && <p className="mt-1 truncate text-xs text-muted-foreground">{ATTACHMENT_KIND_LABELS[a.kind]}</p>}
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(a)}
                disabled={removing === a.id}
                aria-label={`Remove ${a.fileName}`}
                className="touch-hitbox absolute -top-2 -right-2 flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-destructive disabled:opacity-60"
              >
                {removing === a.id ? <Spinner className="size-3.5" /> : <X className="size-3.5" aria-hidden />}
              </button>
            )}
          </li>
        ))}
        {pending.map((p) => (
          <li key={p.key} className="min-w-0" aria-live="polite">
            <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/50 text-muted-foreground">
              <Spinner />
              <span className="text-[0.6875rem]">Uploading…</span>
            </div>
            <p className="mt-1 truncate text-xs text-muted-foreground">{p.name}</p>
          </li>
        ))}
      </ul>
      <AttachmentViewer attachment={viewing} onOpenChange={(open) => !open && setViewing(null)} />
    </>
  );
}
