import { apiRoute } from "@/lib/api/handler";
import { parseId, parseQuery } from "@/lib/api/parse";
import { requireAuth } from "@/lib/auth/session";
import { serveAttachment } from "@/services/attachment.service";
import { attachmentFileQuerySchema } from "@/validators/attachment.schema";

type Ctx = RouteContext<"/api/attachments/[id]/file">;

/** The file itself, after an access check on every request (a redirect to a 60-second signed URL on Supabase). */
export const GET = apiRoute<Ctx>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "ATTACHMENT_NOT_FOUND");
  const { download } = parseQuery(req, attachmentFileQuerySchema);
  return serveAttachment(auth, id, Boolean(download));
});
