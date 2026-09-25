import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EntryForm } from "@/components/transactions/entry-form";
import { requirePageAuth } from "@/lib/auth/session";
import { listCashAccounts } from "@/services/cash-account.service";
import { listCategories } from "@/services/category.service";
import { getEntryFormSettings } from "@/services/company.service";

export const metadata: Metadata = { title: "New transaction" };

const NOTICES: Record<string, string> = {
  scan: "Screenshot scanning isn't enabled yet — enter the details from the UPI screenshot below.",
  receipt: "Receipt upload isn't enabled yet — enter the bill details below.",
};

export default async function NewTransactionPage({ searchParams }: PageProps<"/transactions/new">) {
  const auth = await requirePageAuth("transactions.create");
  const { mode } = await searchParams;
  const [categories, cashAccounts, settings] = await Promise.all([
    listCategories(auth, { activeOnly: true }),
    listCashAccounts(auth, { activeOnly: true }),
    getEntryFormSettings(auth),
  ]);

  return (
    <>
      <PageHeader
        title="New transaction"
        back={{ href: "/transactions", label: "Transactions" }}
        className="mx-auto max-w-2xl"
      />
      <EntryForm
        categories={categories}
        cashAccounts={cashAccounts}
        settings={settings}
        canAdjust={auth.permissions.has("transactions.verify")}
        notice={typeof mode === "string" ? NOTICES[mode] : undefined}
      />
    </>
  );
}
