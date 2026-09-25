import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { created, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { createCashAccount, listCashAccounts } from "@/services/cash-account.service";
import { cashAccountSchema } from "@/validators/company.schema";

export const GET = apiRoute(async (req) => {
  const auth = await requireAuth();
  const activeOnly = req.nextUrl.searchParams.get("active") === "true";
  return ok(await listCashAccounts(auth, { activeOnly }));
});

export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const input = await parseBody(req, cashAccountSchema);
  return created(await createCashAccount(auth, input, getRequestMeta(req.headers)), "Cash account created");
});
