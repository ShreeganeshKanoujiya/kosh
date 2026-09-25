import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { verifyEntry } from "@/services/transaction.service";
import { versionSchema } from "@/validators/entry.schema";

export const POST = apiRoute<RouteContext<"/api/transactions/[id]/verify">>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "TRANSACTION_NOT_FOUND");
  const { version } = await parseBody(req, versionSchema);
  return ok(await verifyEntry(auth, id, version, getRequestMeta(req.headers)), { message: "Transaction verified" });
});
