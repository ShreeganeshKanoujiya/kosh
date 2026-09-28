"use client";

import { Paperclip } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AttachmentPicker } from "@/components/attachments/attachment-picker";
import { Card } from "@/components/ui/card";
import type { EntryDTO } from "@/types/dto";

/** Receipts and screenshots on the transaction screen; editable while the entry is. */
export function EntryAttachments({ entry }: { entry: EntryDTO }) {
  const router = useRouter();
  const [attachments, setAttachments] = useState(entry.attachments);
  const editable = entry.allowedActions.includes("edit");

  return (
    <Card className="gap-4 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Paperclip className="size-4" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">Receipt &amp; attachments</p>
          <p className="text-caption">
            {attachments.length ? `${attachments.length} attached` : editable ? "Nothing attached yet" : "No receipt attached"}
          </p>
        </div>
      </div>
      {(attachments.length > 0 || editable) && (
        <AttachmentPicker
          attachments={attachments}
          onChange={(next) => {
            setAttachments(next);
            // Activity timeline and counts come from the server.
            router.refresh();
          }}
          entryId={entry.id}
          editable={editable}
        />
      )}
    </Card>
  );
}
