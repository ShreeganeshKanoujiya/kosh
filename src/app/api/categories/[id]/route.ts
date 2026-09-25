import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { deleteCategory, updateCategory } from "@/services/category.service";
import { updateCategorySchema } from "@/validators/company.schema";

type Ctx = RouteContext<"/api/categories/[id]">;

export const PATCH = apiRoute<Ctx>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "CATEGORY_NOT_FOUND");
  const input = await parseBody(req, updateCategorySchema);
  return ok(await updateCategory(auth, id, input, getRequestMeta(req.headers)), { message: "Category updated" });
});

export const DELETE = apiRoute<Ctx>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = parseId((await ctx.params).id, "CATEGORY_NOT_FOUND");
  await deleteCategory(auth, id, getRequestMeta(req.headers));
  return ok({ deleted: true }, { message: "Category deleted" });
});
