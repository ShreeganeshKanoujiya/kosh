import type { Metadata } from "next";
import { ProfileForm } from "@/components/settings/profile-form";
import { SettingsSection } from "@/components/settings/settings-section";
import { requirePageAuth } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfileSettingsPage() {
  await requirePageAuth();
  return (
    <SettingsSection title="Profile" description="How you appear to others in your company.">
      <ProfileForm />
    </SettingsSection>
  );
}
