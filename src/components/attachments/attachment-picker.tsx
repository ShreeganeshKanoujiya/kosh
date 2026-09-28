"use client";

import { Camera, Paperclip, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_KIND_LABELS,
  ATTACHMENT_KINDS,
  ATTACHMENTS_PER_ENTRY,
  IMAGE_ACCEPT,
  type AttachmentKindValue,
} from "@/config/attachments";
import { api, errorMessage } from "@/lib/api-client";
import { prepareImageForUpload } from "@/lib/image-prepare";
import { cn } from "@/lib/utils";
import type { AttachmentDTO } from "@/types/dto";
import { AttachmentTiles, type PendingUpload } from "./attachment-tiles";

/**
 * Add / remove receipts, bills and screenshots. Without `entryId` (a new entry), files are
 * uploaded straight away but only linked when the entry is saved; with it, they're attached
 * to that entry immediately.
 */
export function AttachmentPicker({
  attachments,
  onChange,
  entryId,
  editable = true,
  invalid,
  emphasize,
}: {
  attachments: AttachmentDTO[];
  onChange: React.Dispatch<React.SetStateAction<AttachmentDTO[]>>;
  entryId?: string;
  editable?: boolean;
  invalid?: boolean;
  /** Receipt-first flow: a big drop area instead of a small button. */
  emphasize?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const kindRef = useRef<AttachmentKindValue>("receipt");
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [removing, setRemoving] = useState<string | null>(null);
  const room = ATTACHMENTS_PER_ENTRY - attachments.length - pending.length;

  async function upload(files: File[]) {
    const batch = files.slice(0, Math.max(0, room));
    if (files.length > batch.length) toast.error(`An entry can have at most ${ATTACHMENTS_PER_ENTRY} attachments.`);
    for (const original of batch) {
      const key = `${original.name}-${original.size}-${Math.random()}`;
      setPending((p) => [...p, { key, name: original.name }]);
      try {
        const file = await prepareImageForUpload(original);
        const form = new FormData();
        form.set("file", file);
        form.set("kind", kindRef.current);
        if (entryId) form.set("entryId", entryId);
        const { data } = await api<AttachmentDTO>("/api/attachments", { method: "POST", body: form });
        onChange((prev) => [...prev, data]);
      } catch (error) {
        toast.error(errorMessage(error, "Unable to upload the file. Please try again."), { description: original.name });
      } finally {
        setPending((p) => p.filter((x) => x.key !== key));
      }
    }
  }

  async function remove(attachment: AttachmentDTO) {
    setRemoving(attachment.id);
    try {
      await api(`/api/attachments/${attachment.id}`, { method: "DELETE" });
      onChange((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (error) {
      toast.error(errorMessage(error, "Unable to remove the file. Please try again."));
    } finally {
      setRemoving(null);
    }
  }

  const choose = (kind: AttachmentKindValue, camera = false) => {
    kindRef.current = kind;
    (camera ? cameraInput : fileInput).current?.click();
  };

  const onPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length) void upload(files);
  };

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" disabled={room <= 0} aria-invalid={invalid || undefined}>
          <Plus />
          Attach
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onSelect={() => choose("receipt", true)}>
          <Camera />
          Take a photo
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Upload a file (JPG, PNG, WebP, PDF)</DropdownMenuLabel>
        {ATTACHMENT_KINDS.map((kind) => (
          <DropdownMenuItem key={kind} onSelect={() => choose(kind)}>
            <Paperclip />
            {ATTACHMENT_KIND_LABELS[kind]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-3">
      <input ref={fileInput} type="file" accept={ATTACHMENT_ACCEPT} multiple hidden onChange={onPicked} />
      <input ref={cameraInput} type="file" accept={IMAGE_ACCEPT} capture="environment" hidden onChange={onPicked} />

      {editable && emphasize && !attachments.length && !pending.length ? (
        <div className={cn("flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 text-center", invalid && "border-destructive/60")}>
          <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Paperclip className="size-6" aria-hidden />
          </span>
          <div>
            <p className="font-medium">Add the bill or receipt</p>
            <p className="text-caption">Photo or PDF, up to 4 MB each</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={() => choose("receipt", true)}>
              <Camera />
              Take a photo
            </Button>
            <Button type="button" variant="outline" onClick={() => choose("receipt")}>
              <Paperclip />
              Choose file
            </Button>
          </div>
        </div>
      ) : (
        <>
          <AttachmentTiles attachments={attachments} pending={pending} onRemove={editable ? remove : undefined} removing={removing} />
          {editable && room > 0 && <div className="flex justify-start">{menu}</div>}
        </>
      )}
    </div>
  );
}
