import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { SettingsSection } from "@/components/settings/settings-section";
import { LoginHistory, LogoutEverywhere, SessionsList } from "@/components/settings/sessions-list";
import { requirePageAuth } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Security" };

export default async function SecuritySettingsPage() {
  await requirePageAuth();
  return (
    <>
      <SettingsSection title="Change password" description="Other devices are signed out when you change your password.">
        <ChangePasswordForm />
      </SettingsSection>
      <SettingsSection title="Active sessions" description="Devices currently signed in to your account.">
        <SessionsList />
      </SettingsSection>
      <SettingsSection title="Login history" description="Your 20 most recent sign-in attempts.">
        <LoginHistory />
      </SettingsSection>
      <SettingsSection title="Sign out everywhere" description="Use this if you think someone else has access to your account.">
        <LogoutEverywhere />
      </SettingsSection>
    </>
  );
}
