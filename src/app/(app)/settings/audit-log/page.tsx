import type { Metadata } from "next";
import { AuditLogView } from "@/components/settings/audit-log-view";
import { SettingsSection } from "@/components/settings/settings-section";
import { requirePageAuth } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditLogPage() {
  await requirePageAuth("audit_logs.read");
  return (
    <SettingsSection title="Audit log" description="Every important change in your company, who made it and when.">
      <AuditLogView />
    </SettingsSection>
  );
}
