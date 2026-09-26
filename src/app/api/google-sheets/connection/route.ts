import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { getRequestMeta } from "@/lib/security/request-meta";
import { connectSheet, disconnectSheet, getSheetsConnection } from "@/services/google-sheets.service";
import { connectSheetSchema } from "@/validators/export.schema";

export const GET = apiRoute(async () => {
  const auth = await requireAuth();
  return ok(await getSheetsConnection(auth));
});

/** Connect (or replace) the company's spreadsheet. The server checks it can open it before saving. */
export const PUT = apiRoute(async (req) => {
  const auth = await requireAuth();
  const { connection, title } = await connectSheet(auth, await parseBody(req, connectSheetSchema), getRequestMeta(req.headers));
  return ok(connection, { message: `Connected to “${title}”` });
});

export const DELETE = apiRoute(async (req) => {
  const auth = await requireAuth();
  return ok(await disconnectSheet(auth, getRequestMeta(req.headers)), { message: "Google Sheet disconnected" });
});
