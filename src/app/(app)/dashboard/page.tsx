import { ArrowRight, Building2, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requirePageAuth } from "@/lib/auth/session";
import { userRepository } from "@/repositories/user.repository";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export default async function DashboardPage() {
  const auth = await requirePageAuth();
  const activeUsers = await userRepository.countActive(auth.companyId);
  const firstName = auth.user.fullName.split(" ")[0];

  const tiles = [
    { label: "Company code", value: auth.company.code, icon: Building2, mono: true },
    { label: "Active users", value: String(activeUsers), icon: Users },
    { label: "Your role", value: auth.roleName, icon: ShieldCheck },
  ];

  return (
    <>
      <PageHeader title={`${greeting()}, ${firstName}`} description={auth.company.name} />

      <div className="grid gap-3 sm:grid-cols-3 md:gap-4">
        {tiles.map(({ label, value, icon: Icon, mono }) => (
          <Card key={label} className="py-5">
            <CardContent className="flex items-center gap-4">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-meta">{label}</p>
                <p className={mono ? "font-mono text-lg font-semibold tracking-[0.2em]" : "text-lg font-semibold"}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {auth.permissions.has("users.create") && (
        <Card className="mt-6">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-card-title">Add your team</p>
              <p className="text-caption">Create cashiers, accountants and viewers. They log in with your company code.</p>
            </div>
            <Link
              href="/users"
              className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Manage users <ArrowRight className="size-4" aria-hidden />
            </Link>
          </CardContent>
        </Card>
      )}
    </>
  );
}
