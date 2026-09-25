import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { getRequestMeta } from "@/lib/security/request-meta";
import { requestPasswordReset } from "@/services/auth.service";
import { forgotPasswordSchema } from "@/validators/auth.schema";

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, forgotPasswordSchema);
  const message = await requestPasswordReset(input, getRequestMeta(req.headers));
  return ok({ requested: true }, { message });
});
