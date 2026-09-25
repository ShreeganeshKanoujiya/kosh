import type { Metadata } from "next";
import { CompanySettingsForm } from "@/components/settings/company-settings-form";
import { CopyButton } from "@/components/settings/copy-button";
import { SettingsSection } from "@/components/settings/settings-section";
import { requirePageAuth } from "@/lib/auth/session";
import { getCompanySettings } from "@/services/company.service";

export const metadata: Metadata = { title: "Company" };

export default async function CompanySettingsPage() {
  const auth = await requirePageAuth("company.read");
  const settings = await getCompanySettings(auth);
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
    </>
  );
}
