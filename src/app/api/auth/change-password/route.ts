import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { changePassword } from "@/services/auth.service";
import { changePasswordSchema } from "@/validators/auth.schema";

export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const input = await parseBody(req, changePasswordSchema);
  await changePassword(auth, input, getRequestMeta(req.headers));
  return ok({ changed: true }, { message: "Password changed. Other devices have been signed out." });
});
