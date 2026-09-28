import { ATTACHMENT_MAX_BYTES } from "@/config/attachments";
import { apiRoute } from "@/lib/api/handler";
import { parseUpload, validate } from "@/lib/api/parse";
import { created } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { uploadAttachment } from "@/services/attachment.service";
import { uploadAttachmentSchema } from "@/validators/attachment.schema";

/**
 * Upload a receipt / bill / screenshot (multipart: `file`, optional `kind`, optional `entryId`).
 * With `entryId` it's attached immediately; without, it waits to be linked when the entry is saved.
 */
export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const upload = await parseUpload(req, ATTACHMENT_MAX_BYTES);
  const input = validate(uploadAttachmentSchema, upload.fields);
  return created(await uploadAttachment(auth, upload, input, getRequestMeta(req.headers)), "File attached");
});
