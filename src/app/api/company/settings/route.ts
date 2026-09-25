import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { updateCompanySettings } from "@/services/company.service";
import { updateSettingsSchema } from "@/validators/company.schema";

export const PATCH = apiRoute(async (req) => {
  const auth = await requireAuth();
  const input = await parseBody(req, updateSettingsSchema);
  return ok(await updateCompanySettings(auth, input, getRequestMeta(req.headers)), { message: "Settings saved" });
});
