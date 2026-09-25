import "server-only";
import { notFound } from "next/navigation";
import { isAppError } from "@/lib/api/errors";
import { getEntry } from "@/services/transaction.service";
import type { AuthContext } from "@/types/auth";

/** Load an entry for a page: malformed ids, other tenants' ids and missing ids all render the 404 page. */
export async function loadEntryForPage(auth: AuthContext, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  try {
    return await getEntry(auth, id);
  } catch (error) {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  }
}
