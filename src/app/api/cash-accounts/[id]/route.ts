import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { updateCashAccount } from "@/services/cash-account.service";
import { updateCashAccountSchema } from "@/validators/company.schema";

export const PATCH = apiRoute<RouteContext<"/api/cash-accounts/[id]">>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "CASH_ACCOUNT_NOT_FOUND");
  const input = await parseBody(req, updateCashAccountSchema);
  return ok(await updateCashAccount(auth, id, input, getRequestMeta(req.headers)), { message: "Cash account updated" });
});
