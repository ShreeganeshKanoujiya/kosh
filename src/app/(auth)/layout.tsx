import { ShieldCheck, ScanLine, Users } from "lucide-react";
import { KoshWordmark } from "@/components/brand/logo";

const TAGLINE = "Expenses in Control.";
const PITCH =
  "Manage petty cash, track expenses, verify transactions, and keep your company's finances organized — all in one place.";

const HIGHLIGHTS = [
  { icon: ScanLine, title: "Scan UPI screenshots", body: "Amount, merchant and reference captured for you to confirm." },
  { icon: ShieldCheck, title: "Approvals & audit trail", body: "Every entry reviewed, every change recorded." },
  { icon: Users, title: "Built for teams", body: "Cashiers record in seconds. Accountants stay in control." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel — desktop only. Always dark: the Kosh wordmark is white. */}
      <aside className="dark relative hidden flex-col overflow-hidden border-r bg-background p-10 text-foreground lg:flex xl:p-14">
        <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 size-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="relative flex max-w-md flex-1 flex-col justify-center space-y-10">
          <div className="space-y-5">
            <KoshWordmark className="w-40" />
            <div className="space-y-3">
              <p className="text-4xl font-semibold tracking-tight text-balance">{TAGLINE}</p>
              <p className="text-body text-muted-foreground">{PITCH}</p>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-xs">
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
        <p className="relative text-meta">© {new Date().getFullYear()} Kosh</p>
      </aside>

      <main className="flex flex-col px-4 pt-safe pb-safe sm:px-8">
        {/* Phones and tablets: the brand panel is hidden, so show a compact version above the form. */}
        <div className="dark mx-auto mt-4 w-full max-w-[26rem] rounded-2xl border bg-background p-5 text-foreground lg:hidden">
          <KoshWordmark className="w-24" />
          <p className="mt-4 text-xl font-semibold tracking-tight">{TAGLINE}</p>
          <p className="mt-1 text-sm text-muted-foreground">{PITCH}</p>
        </div>
        <div className="flex flex-1 items-start justify-center py-6 sm:items-center sm:py-12">
          <div className="w-full max-w-[26rem]">{children}</div>
        </div>
      </main>
    </div>
  );
}
