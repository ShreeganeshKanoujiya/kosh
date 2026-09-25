import { z } from "zod";
import { apiRoute } from "@/lib/api/handler";
import { parseBody } from "@/lib/api/parse";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { markNotificationsRead } from "@/services/notification.service";

const schema = z.union([z.object({ all: z.literal(true) }), z.object({ ids: z.array(z.uuid()).min(1).max(100) })]);

export const POST = apiRoute(async (req) => {
  const auth = await requireAuth();
  const input = await parseBody(req, schema);
  const count = await markNotificationsRead(auth, "all" in input ? "all" : input.ids);
  return ok({ marked: count });
});
