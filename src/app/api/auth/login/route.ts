import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { setAuthCookies } from "@/lib/auth/cookies";
import { getRequestMeta } from "@/lib/security/request-meta";
import { login } from "@/services/auth.service";
import { loginSchema } from "@/validators/auth.schema";

export const POST = apiRoute(async (req) => {
  const input = await parseBody(req, loginSchema);
  const session = await login(input, getRequestMeta(req.headers));
  const res = ok({ loggedIn: true }, { message: "Welcome back" });
  setAuthCookies(res.cookies, session);
  return res;
});
