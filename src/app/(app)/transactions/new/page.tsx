import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EntryForm } from "@/components/transactions/entry-form";
import { ScanUpi } from "@/components/transactions/scan-upi";
import { requirePageAuth } from "@/lib/auth/session";
import { listCashAccounts } from "@/services/cash-account.service";
import { listCategories } from "@/services/category.service";
import { getEntryFormSettings } from "@/services/company.service";

export const metadata: Metadata = { title: "New transaction" };

export default async function NewTransactionPage({ searchParams }: PageProps<"/transactions/new">) {
  const auth = await requirePageAuth("transactions.create");
  const { mode } = await searchParams;
  const [categories, cashAccounts, settings] = await Promise.all([
    listCategories(auth, { activeOnly: true }),
    listCashAccounts(auth, { activeOnly: true }),
    getEntryFormSettings(auth),
  ]);
  const props = { categories, cashAccounts, settings, canAdjust: auth.permissions.has("transactions.verify") };

  if (mode === "scan") {
    return (
      <>
        <PageHeader title="Scan UPI screenshot" back={{ href: "/transactions", label: "Transactions" }} className="mx-auto max-w-5xl" />
        <ScanUpi {...props} />
      </>
    );
  }

  return (
    <>
      <PageHeader title="New transaction" back={{ href: "/transactions", label: "Transactions" }} className="mx-auto max-w-2xl" />
      <EntryForm {...props} attachFirst={mode === "receipt"} />
    </>
  );
}
