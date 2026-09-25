import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { cancelEntry } from "@/services/transaction.service";
import { versionSchema } from "@/validators/entry.schema";

export const POST = apiRoute<RouteContext<"/api/transactions/[id]/cancel">>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "TRANSACTION_NOT_FOUND");
  const { version } = await parseBody(req, versionSchema);
  return ok(await cancelEntry(auth, id, version, getRequestMeta(req.headers)), { message: "Transaction cancelled" });
});
