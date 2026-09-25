import type { Metadata } from "next";
import { Suspense } from "react";
import { TransactionsView } from "@/components/transactions/transactions-view";
import { ENTRY_PAGE_SIZE as PAGE_SIZE } from "@/config/entries";
import { requirePageAuth } from "@/lib/auth/session";
import { listEntries } from "@/services/transaction.service";
import { listEntriesQuerySchema } from "@/validators/entry.schema";

export const metadata: Metadata = { title: "Transactions" };

export default async function TransactionsPage({ searchParams }: PageProps<"/transactions">) {
  const auth = await requirePageAuth("transactions.read");
  const raw = Object.fromEntries(
    Object.entries(await searchParams).filter((e): e is [string, string] => typeof e[1] === "string" && e[1] !== ""),
  );
  // Invalid params from a hand-edited URL fall back to the defaults instead of erroring.
  const parsed = listEntriesQuerySchema.safeParse({ pageSize: PAGE_SIZE, ...raw });
  const query = parsed.success ? parsed.data : listEntriesQuerySchema.parse({ pageSize: PAGE_SIZE });
  const initialData = await listEntries(auth, query);

  return (
    <Suspense>
      <TransactionsView initialQuery={raw} initialData={initialData} />
    </Suspense>
  );
}
