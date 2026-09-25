import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { created, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { createCategory, listCategories } from "@/services/category.service";
import { categorySchema } from "@/validators/company.schema";

export const GET = apiRoute(async (req) => {
  const auth = await requireAuth();
  const activeOnly = req.nextUrl.searchParams.get("active") === "true";
  return ok(await listCategories(auth, { activeOnly }));
});

export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const input = await parseBody(req, categorySchema);
  return created(await createCategory(auth, input, getRequestMeta(req.headers)), "Category created");
});
