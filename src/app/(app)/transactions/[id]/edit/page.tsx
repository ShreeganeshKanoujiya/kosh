import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { EntryForm } from "@/components/transactions/entry-form";
import { requirePageAuth } from "@/lib/auth/session";
import { listCashAccounts } from "@/services/cash-account.service";
import { listCategories } from "@/services/category.service";
import { getEntryFormSettings } from "@/services/company.service";
import { loadEntryForPage } from "../load-entry";

export const metadata: Metadata = { title: "Edit transaction" };

export default async function EditTransactionPage({ params }: PageProps<"/transactions/[id]/edit">) {
  const auth = await requirePageAuth("transactions.read");
  const { id } = await params;
  const entry = await loadEntryForPage(auth, id);
  // Not editable (approved, someone else's, …) → back to the read-only view.
  if (!entry.allowedActions.includes("edit")) redirect(`/transactions/${id}`);

  const [categories, cashAccounts, settings] = await Promise.all([
    listCategories(auth),
    listCashAccounts(auth),
    getEntryFormSettings(auth),
  ]);

  return (
    <>
      <PageHeader
        title={`Edit ${entry.entryNumber}`}
        back={{ href: `/transactions/${id}`, label: "Back to transaction" }}
        className="mx-auto max-w-2xl"
      />
      <EntryForm
        entry={entry}
        categories={categories}
        cashAccounts={cashAccounts}
        settings={settings}
        canAdjust={auth.permissions.has("transactions.verify")}
      />
    </>
  );
}
