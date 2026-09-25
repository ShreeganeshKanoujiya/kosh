import type { Metadata } from "next";
import { RolesView } from "@/components/settings/roles-view";
import { SettingsSection } from "@/components/settings/settings-section";
import { requirePageAuth } from "@/lib/auth/session";
import { listRoles } from "@/services/role.service";

export const metadata: Metadata = { title: "Roles & permissions" };

export default async function RolesSettingsPage() {
  const auth = await requirePageAuth("roles.read");
  const roles = await listRoles(auth);
  return (
    <SettingsSection title="Roles & permissions" description="Access is granted through permissions, never role names.">
      <div className="space-y-5">
        <RolesView initialRoles={roles} />
      </div>
    </SettingsSection>
  );
}
