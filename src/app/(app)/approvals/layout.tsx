import { requireAnyPagePermission } from "@/lib/auth/session";

/**
 * Gate here, not only in the page: a layout renders outside its segment's loading skeleton,
 * so a denied user gets a real 403 instead of a streamed 200.
 */
export default async function ApprovalsLayout({ children }: { children: React.ReactNode }) {
  await requireAnyPagePermission("transactions.approve", "transactions.reject", "transactions.verify");
  return children;
}
