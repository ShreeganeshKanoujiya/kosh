import { requireAnyPagePermission } from "@/lib/auth/session";

/**
 * Gate here, not only in the pages: a layout renders outside the loading skeletons below it,
 * so a denied user gets a real 403 instead of a streamed 200. Pages still check their own
 * (stricter) permission.
 */
export default async function TransactionsLayout({ children }: { children: React.ReactNode }) {
  await requireAnyPagePermission("transactions.read", "transactions.create");
  return children;
}
