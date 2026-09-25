import { ShieldCheck, ScanLine, Users } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const HIGHLIGHTS = [
  { icon: ScanLine, title: "Scan UPI screenshots", body: "Amount, merchant and reference captured for you to confirm." },
  { icon: ShieldCheck, title: "Approvals & audit trail", body: "Every entry reviewed, every change recorded." },
  { icon: Users, title: "Built for teams", body: "Cashiers record in seconds. Accountants stay in control." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel — desktop only */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r bg-card p-10 lg:flex xl:p-14">
        <Logo />
        <div className="max-w-md space-y-10">
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-balance">
              Petty cash, finally under control.
            </h1>
            <p className="text-body text-muted-foreground">
              Replace notebooks and spreadsheets with one secure place to record, verify and report every rupee.
            </p>
          </div>

          <div className="rounded-2xl border bg-background p-5 shadow-xs">
            <p className="text-meta">Current balance</p>
            <p className="text-amount mt-1 text-3xl">₹18,450.00</p>
            <div className="mt-4 space-y-2.5">
              {[
                ["ABC Stationery", "Office Supplies", "₹450"],
                ["Metro recharge", "Travel", "₹300"],
                ["Tea & snacks", "Refreshments", "₹120"],
              ].map(([name, cat, amt]) => (
                <div key={name} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-meta">{cat}</p>
                  </div>
                  <span className="text-amount">{amt}</span>
                </div>
              ))}
            </div>
          </div>

          <ul className="space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-3">
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-caption">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-meta">© {new Date().getFullYear()} Kosh</p>
      </aside>

      <main className="flex flex-col px-4 pt-safe pb-safe sm:px-8">
        <div className="flex h-16 items-center lg:hidden">
          <Logo />
        </div>
        <div className="flex flex-1 items-start justify-center py-6 sm:items-center sm:py-12">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>
      </main>
    </div>
  );
}
