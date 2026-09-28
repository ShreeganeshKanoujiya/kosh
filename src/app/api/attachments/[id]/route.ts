import { apiRoute } from "@/lib/api/handler";
import { parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { deleteAttachment } from "@/services/attachment.service";

type Ctx = RouteContext<"/api/attachments/[id]">;

export const DELETE = apiRoute<Ctx>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "ATTACHMENT_NOT_FOUND");
  const { label } = await deleteAttachment(auth, id, getRequestMeta(req.headers));
  return ok({ id }, { message: `${label} removed` });
});
