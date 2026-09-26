"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/common/empty-state";
import { FormAlert } from "@/components/forms/form-alert";
import { PageHeader } from "@/components/layout/page-header";
import { useSession } from "@/components/session-provider";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS } from "@/config/entries";
import { useCashAccounts, useCategories, useUserOptions } from "@/hooks/use-reference-data";
import { api, errorMessage } from "@/lib/api-client";
import { addDays, addMonths, endOfMonth, startOfFinancialYear, startOfMonth, startOfQuarter } from "@/lib/dates";
import { formatReportCell } from "@/lib/report-format";
import { cn } from "@/lib/utils";
import type { ReportDTO } from "@/types/dto";
import { REPORT_LABELS, REPORT_TYPES, type ReportType } from "@/validators/report.schema";
import { ExportMenu } from "./export-menu";

const ANY = "any";
const compact = (v: number) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v);

type Preset = { key: string; label: string; range: (today: string, fy: number) => { from: string; to: string } };
const PRESETS: Preset[] = [
  { key: "this_month", label: "This month", range: (t) => ({ from: startOfMonth(t), to: t }) },
  { key: "last_month", label: "Last month", range: (t) => ({ from: addMonths(startOfMonth(t), -1), to: endOfMonth(addMonths(startOfMonth(t), -1)) }) },
  { key: "last_30", label: "Last 30 days", range: (t) => ({ from: addDays(t, -29), to: t }) },
  { key: "this_quarter", label: "This quarter", range: (t) => ({ from: startOfQuarter(t), to: t }) },
  { key: "this_fy", label: "This financial year", range: (t, fy) => ({ from: startOfFinancialYear(t, fy), to: t }) },
];

export function ReportsView({
  today,
  financialYearStartMonth,
  sheetsEnabled,
}: {
  today: string;
  financialYearStartMonth: number;
  sheetsEnabled: boolean;
}) {
  const me = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const defaults = PRESETS[0].range(today, financialYearStartMonth);

  const q = {
    type: (REPORT_TYPES as readonly string[]).includes(params.get("type") ?? "") ? (params.get("type") as ReportType) : "daily",
    from: params.get("from") ?? defaults.from,
    to: params.get("to") ?? defaults.to,
    basis: params.get("basis") === "recorded" ? "recorded" : "approved",
    categoryId: params.get("categoryId") ?? "",
    userId: params.get("userId") ?? "",
    paymentMethod: params.get("paymentMethod") ?? "",
    cashAccountId: params.get("cashAccountId") ?? "",
  };
  const search = new URLSearchParams(Object.entries(q).filter(([, v]) => v)).toString();

  const setQ = (patch: Partial<typeof q>) => {
    const next = new URLSearchParams(Object.entries({ ...q, ...patch }).filter(([, v]) => v) as [string, string][]);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const { data, error, isPending, isFetching } = useQuery({
    queryKey: ["report", search],
    queryFn: async ({ signal }) => (await api<ReportDTO>(`/api/reports?${search}`, { signal })).data,
    placeholderData: keepPreviousData,
  });
  const { data: categories } = useCategories();
  const { data: accounts } = useCashAccounts();
  const { data: users } = useUserOptions(me.can("users.read"));

  const activePreset = PRESETS.find((p) => {
    const r = p.range(today, financialYearStartMonth);
    return r.from === q.from && r.to === q.to;
  })?.key;
  const types = REPORT_TYPES.filter((t) => t !== "cash_account" || me.can("cash_accounts.read"));

  return (
    <>
      <PageHeader
        title="Reports"
        description="Summaries of approved spend by day, category, person and more."
        actions={me.can("reports.export") && data && data.rows.length > 0 && <ExportMenu source="report" query={search} sheetsEnabled={sheetsEnabled} />}
      />

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        {/* Report picker: vertical list on desktop, chips on smaller screens */}
        <nav aria-label="Report type" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <ul className="flex gap-2 lg:flex-col lg:gap-1">
            {types.map((t) => {
              const active = q.type === t;
              return (
                <li key={t} className="shrink-0">
                  <button
                    type="button"
                    aria-current={active ? "page" : undefined}
                    onClick={() => setQ({ type: t })}
                    className={cn(
                      "w-full rounded-full border px-4 py-2 text-left text-sm font-medium whitespace-nowrap transition-colors lg:rounded-lg lg:border-0 lg:px-3 lg:py-2.5 lg:whitespace-normal",
                      active ? "border-primary bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:text-foreground lg:bg-transparent lg:hover:bg-muted",
                    )}
                  >
                    {REPORT_LABELS[t].title}
                    <span className="hidden text-xs font-normal text-muted-foreground lg:block">{REPORT_LABELS[t].description}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 space-y-4">
          {/* Filters: one row above the content they scope */}
          <Card className="gap-4 p-4">
            <div role="group" aria-label="Date range" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  aria-pressed={activePreset === p.key}
                  onClick={() => setQ(p.range(today, financialYearStartMonth))}
                  className={cn(
                    "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                    activePreset === p.key ? "border-primary bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Input type="date" aria-label="From" value={q.from} max={q.to} onChange={(e) => e.target.value && setQ({ from: e.target.value })} />
              <Input type="date" aria-label="To" value={q.to} min={q.from} max={today} onChange={(e) => e.target.value && setQ({ to: e.target.value })} />
              {q.type !== "approval" && (
                <Select value={q.basis} onValueChange={(v) => setQ({ basis: v })}>
                  <SelectTrigger className="w-full" aria-label="Entries included">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">Approved only</SelectItem>
                    <SelectItem value="recorded">All recorded (incl. pending)</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select value={q.categoryId || ANY} onValueChange={(v) => setQ({ categoryId: v === ANY ? "" : v })}>
                <SelectTrigger className="w-full" aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All categories</SelectItem>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {me.can("users.read") && (
                <Select value={q.userId || ANY} onValueChange={(v) => setQ({ userId: v === ANY ? "" : v })}>
                  <SelectTrigger className="w-full" aria-label="Created by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Everyone</SelectItem>
                    {(users ?? []).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={q.paymentMethod || ANY} onValueChange={(v) => setQ({ paymentMethod: v === ANY ? "" : v })}>
                <SelectTrigger className="w-full" aria-label="Payment method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY}>All payment methods</SelectItem>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(accounts?.length ?? 0) > 1 && (
                <Select value={q.cashAccountId || ANY} onValueChange={(v) => setQ({ cashAccountId: v === ANY ? "" : v })}>
                  <SelectTrigger className="w-full" aria-label="Cash account">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>All cash accounts</SelectItem>
                    {(accounts ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </Card>

          {error ? (
            <FormAlert message={errorMessage(error)} />
          ) : isPending || !data ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : (
            <Card className={cn("gap-5 p-5 transition-opacity", isFetching && "opacity-60")} aria-busy={isFetching}>
              <div>
                <h2 className="text-section-title">{data.title}</h2>
                <p className="text-caption">{data.subtitle}</p>
              </div>

              {data.rows.length === 0 ? (
                <EmptyState icon={BarChart3} title="No data for this range" description="Try a wider date range or fewer filters." className="border-0" />
              ) : (
                <>
                  {data.chart && data.rows.length > 1 && (
                    <div className="h-56 w-full">
                      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 640, height: 224 }}>
                        <BarChart data={data.rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap={2}>
                          <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
                          <XAxis
                            dataKey={data.chart.xKey}
                            tickFormatter={(v) => formatReportCell(v, data.columns[0].kind, data.currency).replace(/ \d{4}$/, "")}
                            tick={{ fill: "var(--viz-axis)", fontSize: 12 }}
                            tickLine={false}
                            axisLine={{ stroke: "var(--viz-grid)" }}
                            minTickGap={32}
                          />
                          <YAxis tickFormatter={compact} tick={{ fill: "var(--viz-axis)", fontSize: 12 }} tickLine={false} axisLine={false} width={44} />
                          <Tooltip
                            cursor={{ fill: "var(--muted)", opacity: 0.6 }}
                            content={({ active, payload, label }) =>
                              active && payload?.length ? (
                                <div className="rounded-lg border bg-popover px-3 py-2 shadow-md">
                                  <p className="text-sm font-semibold tabular-nums">{formatReportCell(Number(payload[0].value), "money", data.currency)}</p>
                                  <p className="text-xs text-muted-foreground">{formatReportCell(label as string, data.columns[0].kind, data.currency)}</p>
                                </div>
                              ) : null
                            }
                          />
                          <Bar dataKey={data.chart.yKey} fill="var(--viz-accent)" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  <div className="-mx-5 overflow-x-auto px-5">
                    <table className="w-full min-w-[36rem] text-sm">
                      <caption className="sr-only">
                        {data.title}, {data.subtitle}
                      </caption>
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          {data.columns.map((c, i) => (
                            <th key={c.key} scope="col" className={cn("py-2.5 font-medium whitespace-nowrap", i === 0 ? "text-left" : "text-right")}>
                              {c.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.rows.map((row, r) => (
                          <tr key={r} className="border-b last:border-0 hover:bg-muted/40">
                            {data.columns.map((c, i) =>
                              i === 0 ? (
                                <th key={c.key} scope="row" className="py-2.5 text-left font-medium">
                                  {formatReportCell(row[c.key], c.kind, data.currency)}
                                </th>
                              ) : (
                                <td key={c.key} className="py-2.5 text-right whitespace-nowrap tabular-nums">
                                  {formatReportCell(row[c.key], c.kind, data.currency)}
                                </td>
                              ),
                            )}
                          </tr>
                        ))}
                      </tbody>
                      {data.totals && (
                        <tfoot>
                          <tr className="border-t-2 font-semibold">
                            {data.columns.map((c, i) => (
                              <td key={c.key} className={cn("py-2.5 whitespace-nowrap tabular-nums", i === 0 ? "text-left" : "text-right")}>
                                {i === 0 ? "Total" : data.totals![c.key] === null || data.totals![c.key] === undefined ? "" : formatReportCell(data.totals![c.key], c.kind, data.currency)}
                              </td>
                            ))}
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
