import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { getCompanySettings, renameCompany } from "@/services/company.service";
import { updateCompanySchema } from "@/validators/company.schema";

export const GET = apiRoute(async () => {
  const auth = await requireAuth();
  return ok(await getCompanySettings(auth));
});

export const PATCH = apiRoute(async (req) => {
  const auth = await requireAuth();
  await renameCompany(auth, await parseBody(req, updateCompanySchema), getRequestMeta(req.headers));
  return ok({ updated: true }, { message: "Company updated" });
});
