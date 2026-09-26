import { apiRoute } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { buildReport } from "@/services/report.service";
import { reportQuerySchema } from "@/validators/report.schema";

export const GET = apiRoute(async (req) => {
  const auth = await requireAuth();
  return ok(await buildReport(auth, parseQuery(req, reportQuerySchema)));
});
