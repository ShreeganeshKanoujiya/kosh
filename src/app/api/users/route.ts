import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseQuery } from "@/lib/api/parse";
import { created, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { createUser, listUsers } from "@/services/user.service";
import { createUserSchema, listUsersQuerySchema } from "@/validators/user.schema";

export const GET = apiRoute(async (req) => {
  const auth = await requireAuth();
  return ok(await listUsers(auth, parseQuery(req, listUsersQuerySchema)));
});

export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const input = await parseBody(req, createUserSchema);
  return created(await createUser(auth, input, getRequestMeta(req.headers)), "User created");
});
