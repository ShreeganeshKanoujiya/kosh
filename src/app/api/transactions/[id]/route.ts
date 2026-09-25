import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseId } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { deleteEntry, getEntry, updateEntry } from "@/services/transaction.service";
import { updateEntrySchema, versionSchema } from "@/validators/entry.schema";

type Ctx = RouteContext<"/api/transactions/[id]">;
const idOf = async (ctx: Ctx) => parseId((await ctx.params).id, "TRANSACTION_NOT_FOUND");

export const GET = apiRoute<Ctx>(async (_req, ctx) => {
  const auth = await requireAuth();
  return ok(await getEntry(auth, await idOf(ctx)));
});

export const PATCH = apiRoute<Ctx>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = await idOf(ctx);
  const input = await parseBody(req, updateEntrySchema);
  return ok(await updateEntry(auth, id, input, getRequestMeta(req.headers)), { message: "Transaction updated" });
});

/** Soft delete. Requires the current `version` so a stale screen can't delete a changed entry. */
export const DELETE = apiRoute<Ctx>(async (req, ctx) => {
  const auth = await requireAuth();
  const id = await idOf(ctx);
  const { version } = await parseBody(req, versionSchema);
  return ok(await deleteEntry(auth, id, version, getRequestMeta(req.headers)), { message: "Transaction deleted" });
});
