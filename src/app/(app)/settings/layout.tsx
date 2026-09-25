import { PageHeader } from "@/components/layout/page-header";
import { SettingsNav, type SettingsNavItem } from "@/components/settings/settings-nav";
import { requirePageAuth } from "@/lib/auth/session";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const auth = await requirePageAuth();
  const items: SettingsNavItem[] = [
    { href: "/settings", label: "Profile" },
    { href: "/settings/security", label: "Security" },
    ...(auth.permissions.has("company.read") ? [{ href: "/settings/company", label: "Company" }] : []),
    ...(auth.permissions.has("roles.read") ? [{ href: "/settings/roles", label: "Roles & permissions" }] : []),
  ];

  return (
    <>
      <PageHeader title="Settings" description="Your account, security and company preferences." />
      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
        <SettingsNav items={items} />
        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </>
  );
}
