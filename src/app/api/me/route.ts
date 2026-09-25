import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { getMe, updateProfile } from "@/services/auth.service";
import { updateProfileSchema } from "@/validators/auth.schema";

export const GET = apiRoute(async () => {
  const auth = await requireAuth();
  return ok(await getMe(auth));
});

export const PATCH = apiRoute(async (req) => {
  const auth = await requireAuth();
  const input = await parseBody(req, updateProfileSchema);
  await updateProfile(auth, input, getRequestMeta(req.headers));
  return ok({ updated: true }, { message: "Profile updated" });
});
