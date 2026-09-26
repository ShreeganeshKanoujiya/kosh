import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EntryDetail } from "@/components/transactions/entry-detail";
import { requirePageAuth } from "@/lib/auth/session";
import { entryHistory } from "@/services/audit-query.service";
import { loadEntryForPage } from "./load-entry";

export const metadata: Metadata = { title: "Transaction" };

export default async function TransactionPage({ params }: PageProps<"/transactions/[id]">) {
  const auth = await requirePageAuth("transactions.read");
  const { id } = await params;
  const entry = await loadEntryForPage(auth, id);
  const history = await entryHistory(auth, entry.id);

  return (
    <>
      <PageHeader title={entry.entryNumber} back={{ href: "/transactions", label: "Transactions" }} />
      <EntryDetail entry={entry} history={history} />
    </>
  );
}
