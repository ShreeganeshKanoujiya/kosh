import { apiRoute } from "@/lib/api/handler";
import { parseBody, parseQuery } from "@/lib/api/parse";
import { created, ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { createEntry, listEntries } from "@/services/transaction.service";
import { createEntrySchema, listEntriesQuerySchema } from "@/validators/entry.schema";

/** Server-side filtering + pagination. companyId always comes from the session, never the query. */
export const GET = apiRoute(async (req) => {
  const auth = await requireAuth();
  return ok(await listEntries(auth, parseQuery(req, listEntriesQuerySchema)));
});

export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const input = await parseBody(req, createEntrySchema);
  const entry = await createEntry(auth, input, getRequestMeta(req.headers));
  return created(entry, entry.status === "draft" ? "Draft saved" : "Transaction created");
});
