import type { Metadata } from "next";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { CopyButton } from "@/components/settings/copy-button";
import { GoogleSheetsSection } from "@/components/settings/google-sheets-section";
import { SettingsSection } from "@/components/settings/settings-section";
import { requirePageAuth } from "@/lib/auth/session";
import { getCompanySettings } from "@/services/company.service";
import { getSheetsConnection } from "@/services/google-sheets.service";

export const metadata: Metadata = { title: "Company" };

export default async function CompanySettingsPage() {
  const auth = await requirePageAuth("company.read");
  const [settings, sheets] = await Promise.all([getCompanySettings(auth), getSheetsConnection(auth)]);
  return (
    <>
      <SettingsSection title="Company code" description="Everyone logs in with this code. Share it only with people you add as users.">
        <div className="flex items-center gap-3">
          <span className="font-mono text-2xl font-semibold tracking-[0.3em]">{settings.companyCode}</span>
          <CopyButton value={settings.companyCode} />
        </div>
      </SettingsSection>
      <SettingsSection title="Company & approvals" description="How petty cash works in your company.">
        <CompanySettingsForm settings={settings} />
      </SettingsSection>
      <SettingsSection title="Google Sheets" description="Send reports and transaction lists to a Google Sheet your team already uses.">
        <GoogleSheetsSection initial={sheets} />
      </SettingsSection>
    </>
  );
}
