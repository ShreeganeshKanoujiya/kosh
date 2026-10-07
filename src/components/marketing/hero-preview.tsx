import { Check, ScanLine } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";

const RECENT = [
  { name: "ABC Stationery", meta: "Office Supplies · UPI", amount: "₹450.00", status: "Approved", tone: "success" },
  { name: "Metro card recharge", meta: "Travel · Cash", amount: "₹300.00", status: "Submitted", tone: "info" },
  { name: "Tea & snacks", meta: "Refreshments · UPI", amount: "₹120.00", status: "Pending approval", tone: "warning" },
] as const;

const SCANNED = [
  ["Amount", "₹450.00", 98],
  ["Paid to", "ABC Stationery", 95],
  ["UPI ref", "4127 9930 2214", 97],
] as const;

/** Illustration of the app for the landing hero: a balance card with recent entries and a scanned screenshot. */
export function HeroPreview({ className }: { className?: string }) {
  return (
    <div role="img" aria-label="Kosh showing a cash balance, recent entries with their approval status, and a scanned UPI payment" className={cn("relative", className)}>
      <div aria-hidden className="pointer-events-none absolute inset-x-8 top-10 -bottom-6 rounded-[2rem] bg-primary/20 blur-3xl" />

      <div className="relative rounded-3xl border bg-card p-5 shadow-xl shadow-black/5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-meta">Current cash balance</p>
            <p className="text-amount mt-1 text-3xl">₹18,450.00</p>
            <p className="mt-1 text-xs text-success">Main Cash · up to date</p>
          </div>
          <div className="flex h-12 items-end gap-1" aria-hidden>
            {[40, 65, 35, 80, 55, 90, 60].map((h, i) => (
              <span key={i} className="w-2 rounded-full bg-primary/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="mt-5 divide-y rounded-2xl border">
          {RECENT.map((row) => (
            <div key={row.name} className="flex items-center gap-3 px-3.5 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{row.name}</p>
                <p className="truncate text-xs text-muted-foreground">{row.meta}</p>
              </div>
              <div className="text-right">
                <p className="text-amount text-sm">{row.amount}</p>
                <StatusBadge tone={row.tone} className="mt-0.5">
                  {row.status}
                </StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-4 -mt-6 rounded-2xl border bg-popover p-4 shadow-lg shadow-black/10 sm:absolute sm:-right-4 sm:-bottom-24 sm:mx-0 sm:mt-0 sm:w-72 lg:-right-8">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <ScanLine className="size-4" />
          </span>
          <p className="text-sm font-semibold">Screenshot read</p>
          <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] font-medium text-muted-foreground">Google Pay</span>
        </div>
        <dl className="mt-3 space-y-2">
          {SCANNED.map(([label, value, confidence]) => (
            <div key={label} className="flex items-center gap-2 text-sm">
              <dt className="w-16 shrink-0 text-xs text-muted-foreground">{label}</dt>
              <dd className="min-w-0 flex-1 truncate font-medium">{value}</dd>
              <dd className="inline-flex items-center gap-0.5 text-[0.6875rem] font-medium text-success">
                <Check className="size-3" />
                {confidence}%
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
