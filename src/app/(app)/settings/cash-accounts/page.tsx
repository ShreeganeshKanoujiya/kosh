import type { Metadata } from "next";
import { CashAccountsView } from "@/components/settings/cash-accounts-view";
import { SettingsSection } from "@/components/settings/settings-section";
import { requirePageAuth } from "@/lib/auth/session";
import { listCashAccounts } from "@/services/cash-account.service";

export const metadata: Metadata = { title: "Cash accounts" };

export default async function CashAccountsPage() {
  const auth = await requirePageAuth("cash_accounts.read");
  return (
    <SettingsSection title="Cash accounts" description="Each drawer, branch or wallet of petty cash, with its running balance.">
      <CashAccountsView initialData={await listCashAccounts(auth)} />
    </SettingsSection>
  );
}
