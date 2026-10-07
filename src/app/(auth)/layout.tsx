import Link from "next/link";
import { KoshWordmark } from "@/components/brand/logo";

const FOOTER_LINKS = [
  { href: "/help", label: "Help" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

/** Login, sign-up and password screens: just the form, centred on the page. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-4 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+2.5rem)] sm:px-6">
      <div aria-hidden className="pointer-events-none absolute -top-56 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <main className="relative w-full max-w-[28rem]">
        <Link href="/" aria-label="Kosh home" className="mx-auto mb-8 flex w-fit rounded-lg">
          <KoshWordmark adaptive className="w-32" />
        </Link>

        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">{children}</div>

        <nav aria-label="More" className="mt-6">
          <ul className="flex justify-center gap-5">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="inline-flex min-h-9 items-center text-meta hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
    </div>
  );
}
