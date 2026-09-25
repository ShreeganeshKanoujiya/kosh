import { apiRoute } from "@/lib/api/handler";
import { ok } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";
import { listMyNotifications } from "@/services/notification.service";

export const GET = apiRoute(async () => {
  const auth = await requireAuth();
  return ok(await listMyNotifications(auth));
});
