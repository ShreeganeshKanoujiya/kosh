import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { created } from "@/lib/api/response";
import { setAuthCookies } from "@/lib/auth/cookies";
import { getRequestMeta } from "@/lib/security/request-meta";
import { registerCompany } from "@/services/auth.service";
import { registerSchema } from "@/validators/auth.schema";

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, registerSchema);
  const { result, session } = await registerCompany(input, getRequestMeta(req.headers));
  const res = created(result, "Company created successfully");
  setAuthCookies(res.cookies, session);
  return res;
});
