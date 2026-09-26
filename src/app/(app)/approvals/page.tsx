import type { Metadata } from "next";
import { ApprovalsView } from "@/components/approvals/approvals-view";
import { APPROVAL_QUERY } from "@/config/entries";
import { requireAnyPagePermission } from "@/lib/auth/session";
import { listEntries } from "@/services/transaction.service";
import { listEntriesQuerySchema } from "@/validators/entry.schema";

export const metadata: Metadata = { title: "Approvals" };

export default async function ApprovalsPage() {
  const auth = await requireAnyPagePermission("transactions.approve", "transactions.reject", "transactions.verify");
  const initialData = await listEntries(auth, listEntriesQuerySchema.parse(APPROVAL_QUERY));
  return <ApprovalsView initialData={initialData} />;
}
