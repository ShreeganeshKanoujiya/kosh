import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { rejectEntry } from "@/services/transaction.service";
import { rejectEntrySchema } from "@/validators/entry.schema";

/** Rejection always carries a reason for the submitter. */
export const POST = apiRoute<RouteContext<"/api/transactions/[id]/reject">>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "TRANSACTION_NOT_FOUND");
  const input = await parseBody(req, rejectEntrySchema);
  return ok(await rejectEntry(auth, id, input, getRequestMeta(req.headers)), { message: "Transaction rejected" });
});
