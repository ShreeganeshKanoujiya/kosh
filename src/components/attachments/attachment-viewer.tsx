"use client";

import { Download, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ATTACHMENT_KIND_LABELS, formatFileSize } from "@/config/attachments";
import type { AttachmentDTO } from "@/types/dto";

/** Full-size look at one attachment, with open-in-new-tab and download. */
export function AttachmentViewer({ attachment, onOpenChange }: { attachment: AttachmentDTO | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={attachment !== null} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-3 p-3 sm:max-w-2xl sm:p-4">
        {attachment && (
          <>
            <DialogHeader className="pr-10 text-left">
              <DialogTitle className="truncate">{attachment.fileName}</DialogTitle>
              <DialogDescription>
                {ATTACHMENT_KIND_LABELS[attachment.kind]} · {formatFileSize(attachment.fileSize)} · added by {attachment.uploadedBy.fullName}
              </DialogDescription>
            </DialogHeader>
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto rounded-lg bg-muted">
              {attachment.isImage ? (
                // eslint-disable-next-line @next/next/no-img-element -- access-checked API URL, not a static asset
                <img src={attachment.url} alt={`${ATTACHMENT_KIND_LABELS[attachment.kind]}: ${attachment.fileName}`} className="max-h-[70dvh] w-auto object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                  <FileText className="size-12" aria-hidden />
                  <p className="text-sm">PDF document</p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" asChild>
                <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                  Open
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href={`${attachment.url}?download=1`} download={attachment.fileName}>
                  <Download />
                  Download
                </a>
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
