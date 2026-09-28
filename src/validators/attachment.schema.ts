import { z } from "zod";
import { ATTACHMENT_KINDS } from "@/config/attachments";
import { idSchema } from "./common";

/** Text fields sent alongside the file in a multipart upload. */
export const uploadAttachmentSchema = z.object({
  kind: z.enum(ATTACHMENT_KINDS).default("receipt"),
  /** Attach straight to an existing entry; omit to upload for an entry that isn't saved yet. */
  entryId: idSchema.optional(),
});

export const attachmentFileQuerySchema = z.object({
  download: z.enum(["1", "true"]).optional(),
});
