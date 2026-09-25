import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { getRequestMeta } from "@/lib/security/request-meta";
import { resetPassword } from "@/services/auth.service";
import { resetPasswordSchema } from "@/validators/auth.schema";

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, resetPasswordSchema);
  await resetPassword(input, getRequestMeta(req.headers));
  const res = ok({ reset: true }, { message: "Password updated. Please log in with your new password." });
  // Every session was revoked; make sure this browser starts clean too.
  clearAuthCookies(res.cookies);
  return res;
});
