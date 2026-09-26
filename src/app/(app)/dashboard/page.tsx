import { ArrowRight, CalendarDays, Clock, Plus, ReceiptText, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CategoryBreakdown, ExpenseTrendChart, MonthlyComparison, PaymentMix } from "@/components/dashboard/charts";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntryCards } from "@/components/transactions/entry-list";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requirePageAuth } from "@/lib/auth/session";
import { formatCurrency, formatNumber } from "@/lib/format";
import { getDashboard } from "@/services/dashboard.service";

export const metadata: Metadata = { title: "Dashboard" };

function greeting(timeZone: string) {
  const hour = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone }).format(new Date()));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

function StatTile({
  label,
  value,
  sub,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: typeof Clock;
  href?: string;
}) {
  const body = (
    <Card className="h-full gap-3 p-4 transition-colors md:p-5 [a:hover>&]:bg-muted/40">
      <div className="flex items-center justify-between">
        <p className="text-caption">{label}</p>
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="text-meta">{sub}</p>}
    </Card>
  );
  return href ? (
    <Link href={href} className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function DashboardPage() {
  const auth = await requirePageAuth();
  const d = await getDashboard(auth);
  const firstName = auth.user.fullName.split(" ")[0];
  const canRead = auth.permissions.has("transactions.read");
  const canCreate = auth.permissions.has("transactions.create");
  const money = (v: string | number) => formatCurrency(v, d.currency);

  return (
    <>
      <PageHeader
        title={`${greeting(d.timezone)}, ${firstName}`}
        description={`${auth.company.name} · ${new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${d.today}T00:00:00Z`))}`}
      />

      <div className="grid gap-3 md:gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        {/* Hero: the one number the dashboard leads with */}
        {d.cashBalance !== null && (
          <Card className="justify-between gap-6 p-6">
            <div>
              <p className="text-caption">Current cash balance</p>
              <p className={`mt-1 text-5xl font-semibold tracking-tight ${Number(d.cashBalance) < 0 ? "text-destructive" : ""}`}>
                {money(d.cashBalance)}
              </p>
              {d.cashAccounts.length > 1 && (
                <ul className="mt-4 space-y-1.5">
                  {d.cashAccounts.map((a) => (
                    <li key={a.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{a.name}</span>
                      <span className="font-medium tabular-nums">{money(a.balance)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-meta mt-3">Approved entries only</p>
            </div>
            {canCreate && (
              <Button asChild size="lg" className="w-full md:w-auto md:self-start">
                <Link href="/transactions/new?mode=manual">
                  <Plus />
                  Add expense
                </Link>
              </Button>
            )}
          </Card>
        )}

        {canRead && (
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <StatTile label="Today's expenses" value={money(d.todayExpenses)} sub="Recorded today" icon={CalendarDays} />
            <StatTile
              label="This month"
              value={money(d.monthExpenses)}
              sub={Number(d.monthIncome) > 0 ? `Cash added ${money(d.monthIncome)}` : "Expenses this month"}
              icon={ReceiptText}
            />
            <StatTile
              label="Pending approvals"
              value={formatNumber(d.pendingApprovals.count)}
              sub={d.pendingApprovals.count ? `${money(d.pendingApprovals.amount)} awaiting review` : "Nothing waiting"}
              icon={Clock}
              href="/transactions?status=submitted,pending_approval"
            />
            <StatTile
              label="Total transactions"
              value={formatNumber(d.totalTransactions)}
              sub={d.activeUsers !== null ? `${d.activeUsers} active user${d.activeUsers === 1 ? "" : "s"}` : undefined}
              icon={Users}
            />
          </div>
        )}
      </div>

      {canRead && (
        <>
          <div className="mt-3 grid gap-3 md:mt-4 md:gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
            <ExpenseTrendChart data={d.trend} currency={d.currency} />
            <CategoryBreakdown data={d.categoryBreakdown} currency={d.currency} />
          </div>
          <div className="mt-3 grid gap-3 md:mt-4 md:gap-4 lg:grid-cols-2">
            <MonthlyComparison data={d.monthly} currency={d.currency} />
            <PaymentMix data={d.paymentBreakdown} currency={d.currency} />
          </div>

          <section className="mt-8" aria-labelledby="recent-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="recent-heading" className="text-section-title">
                Recent transactions
              </h2>
              <Link href="/transactions" className="inline-flex min-h-10 items-center gap-1 text-sm font-medium text-primary hover:underline">
                View all <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            {d.recent.length ? (
              <EntryCards items={d.recent} today={d.today} />
            ) : (
              <EmptyState
                icon={ReceiptText}
                title="No transactions yet"
                description="Start recording your petty cash expenses."
                action={
                  canCreate && (
                    <Button asChild>
                      <Link href="/transactions/new?mode=manual">
                        <Plus />
                        Add transaction
                      </Link>
                    </Button>
                  )
                }
              />
            )}
          </section>
        </>
      )}
    </>
  );
}
