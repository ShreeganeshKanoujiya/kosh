"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PAYMENT_METHOD_LABELS, type PaymentMethodValue } from "@/config/entries";
import { formatCurrency } from "@/lib/format";
import type { DashboardDTO } from "@/types/dto";
import { ChartCard, ChartEmpty, DataTable } from "./chart-card";

const compact = (v: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(v);
const shortDay = (ymd: string) =>
  new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${ymd}T00:00:00Z`));
const shortMonth = (ym: string) =>
  new Intl.DateTimeFormat("en-IN", { month: "short", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));
const longMonth = (ym: string) =>
  new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-01T00:00:00Z`));

const AXIS_TICK = { fill: "var(--viz-axis)", fontSize: 12 };

/** Tooltip: the value leads, the label follows; a short line key identifies the series. */
function ValueTooltip({
  active,
  payload,
  label,
  currency,
  formatLabel,
}: {
  active?: boolean;
  payload?: { value?: number | string }[];
  label?: string | number;
  currency: string;
  formatLabel: (l: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="flex items-center gap-2 text-sm font-semibold tabular-nums">
        <span className="h-0.5 w-3 rounded-full bg-(--viz-accent)" aria-hidden />
        {formatCurrency(Number(payload[0].value ?? 0), currency)}
      </p>
      <p className="text-xs text-muted-foreground">{formatLabel(String(label))}</p>
    </div>
  );
}

export function ExpenseTrendChart({ data, currency }: { data: DashboardDTO["trend"]; currency: string }) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  return (
    <ChartCard
      title="Expense trend"
      subtitle={`Last 30 days · ${formatCurrency(total, currency)}`}
      empty={total === 0 ? <ChartEmpty message="No expenses in the last 30 days yet." /> : undefined}
      chart={
        <div className="min-h-56 w-full flex-1">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 224 }}>
            <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: 0 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
              <XAxis
                dataKey="date"
                tickFormatter={shortDay}
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={{ stroke: "var(--viz-grid)" }}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis tickFormatter={compact} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.6 }} content={<ValueTooltip currency={currency} formatLabel={shortDay} />} />
              <Bar dataKey="amount" name="Expenses" fill="var(--viz-accent)" maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <DataTable
          columns={["Date", "Expenses"]}
          rows={[...data].reverse().map((d) => [shortDay(d.date), formatCurrency(d.amount, currency)])}
        />
      }
    />
  );
}

/** Ranked horizontal bars (one hue): magnitude comparison, labelled at the tip. */
export function CategoryBreakdown({ data, currency }: { data: DashboardDTO["categoryBreakdown"]; currency: string }) {
  const top = data.slice(0, 6);
  const rest = data.slice(6).reduce((s, d) => s + d.amount, 0);
  const rows = rest > 0 ? [...top, { name: "Other", amount: rest }] : top;
  const max = Math.max(...rows.map((r) => r.amount), 1);
  const total = data.reduce((s, d) => s + d.amount, 0);
  return (
    <ChartCard
      title="By category"
      subtitle="This month"
      empty={rows.length === 0 ? <ChartEmpty message="No categorised expenses this month." /> : undefined}
      chart={
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.name} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate">{r.name}</span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatCurrency(r.amount, currency)}
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">{Math.round((r.amount / total) * 100)}%</span>
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted" aria-hidden>
                <div className="h-2 rounded-full bg-(--viz-accent)" style={{ width: `${Math.max(2, (r.amount / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      }
      table={<DataTable columns={["Category", "Amount", "Share"]} rows={rows.map((r) => [r.name, formatCurrency(r.amount, currency), `${Math.round((r.amount / total) * 100)}%`])} />}
    />
  );
}

/** Colour follows the entity: each payment method always gets the same validated slot. */
const METHOD_SLOT: Record<PaymentMethodValue, string> = {
  cash: "var(--viz-1)",
  upi: "var(--viz-2)",
  card: "var(--viz-3)",
  bank_transfer: "var(--viz-4)",
  other: "var(--viz-5)",
};

/** Part-to-whole: one stacked bar with 2px surface gaps, legend carries the values. */
export function PaymentMix({ data, currency }: { data: DashboardDTO["paymentBreakdown"]; currency: string }) {
  const total = data.reduce((s, d) => s + d.amount, 0);
  const pct = (v: number) => Math.round((v / total) * 100);
  return (
    <ChartCard
      title="Payment methods"
      subtitle="This month's expenses"
      empty={total === 0 ? <ChartEmpty message="No expenses this month." /> : undefined}
      chart={
        <div className="space-y-4">
          <div className="flex h-4 gap-0.5 overflow-hidden rounded-full" role="img" aria-label={data.map((d) => `${PAYMENT_METHOD_LABELS[d.method]} ${pct(d.amount)}%`).join(", ")}>
            {data.map((d) => (
              <div
                key={d.method}
                title={`${PAYMENT_METHOD_LABELS[d.method]}: ${formatCurrency(d.amount, currency)} (${pct(d.amount)}%)`}
                className="h-full first:rounded-l-full last:rounded-r-full"
                style={{ width: `${(d.amount / total) * 100}%`, background: METHOD_SLOT[d.method] }}
              />
            ))}
          </div>
          <ul className="space-y-2.5">
            {data.map((d) => (
              <li key={d.method} className="flex items-center gap-2.5 text-sm">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: METHOD_SLOT[d.method] }} aria-hidden />
                <span className="flex-1 truncate">{PAYMENT_METHOD_LABELS[d.method]}</span>
                <span className="font-medium tabular-nums">{formatCurrency(d.amount, currency)}</span>
                <span className="w-9 text-right text-xs text-muted-foreground tabular-nums">{pct(d.amount)}%</span>
              </li>
            ))}
          </ul>
        </div>
      }
      table={<DataTable columns={["Method", "Amount", "Share"]} rows={data.map((d) => [PAYMENT_METHOD_LABELS[d.method], formatCurrency(d.amount, currency), `${pct(d.amount)}%`])} />}
    />
  );
}

/** Emphasis form: the current month in the accent, earlier months recede. */
export function MonthlyComparison({ data, currency }: { data: DashboardDTO["monthly"]; currency: string }) {
  const hasData = data.some((d) => d.expense > 0);
  const last = data.length - 1;
  return (
    <ChartCard
      title="Monthly comparison"
      subtitle="Expenses, last 6 months"
      empty={!hasData ? <ChartEmpty message="Monthly totals appear once expenses are recorded." /> : undefined}
      chart={
        <div className="min-h-56 w-full flex-1">
          <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 224 }}>
            <BarChart data={data} margin={{ top: 20, right: 4, bottom: 0, left: 0 }} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
              <XAxis dataKey="month" tickFormatter={shortMonth} tick={AXIS_TICK} tickLine={false} axisLine={{ stroke: "var(--viz-grid)" }} />
              <YAxis tickFormatter={compact} tick={AXIS_TICK} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.5 }} content={<ValueTooltip currency={currency} formatLabel={longMonth} />} />
              <Bar
                dataKey="expense"
                name="Expenses"
                maxBarSize={24}
                radius={[4, 4, 0, 0]}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="expense"
                  position="top"
                  offset={6}
                  content={(props) => {
                    const { x, y, width, value, index } = props as { x: number; y: number; width: number; value: number; index: number };
                    if (index !== last || !Number(value)) return null;
                    return (
                      <text x={x + width / 2} y={y - 6} textAnchor="middle" className="fill-foreground text-xs font-medium">
                        {compact(Number(value))}
                      </text>
                    );
                  }}
                />
                {data.map((d, i) => (
                  <Cell key={d.month} fill={i === last ? "var(--viz-accent)" : "var(--viz-muted)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      }
      table={
        <DataTable
          columns={["Month", "Expenses", "Cash added"]}
          rows={[...data].reverse().map((d) => [longMonth(d.month), formatCurrency(d.expense, currency), formatCurrency(d.income, currency)])}
        />
      }
    />
  );
}
