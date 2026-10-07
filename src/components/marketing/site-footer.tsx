import Link from "next/link";
import { KoshWordmark } from "@/components/brand/logo";
import { SITE } from "@/config/site";
import { FOOTER_GROUPS } from "./site-links";

export function SiteFooter() {
  return (
    <footer className="border-t bg-card pb-safe">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(4,1fr)] md:py-16">
        <div className="max-w-xs space-y-3">
          <KoshWordmark adaptive className="w-24" />
          <p className="text-caption">
            Petty cash management for Indian businesses. Record, approve and report every rupee — from any phone.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-4">
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-sm font-semibold">{group.title}</p>
              <ul className="mt-3 space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-9 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-meta sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <p>Made in India for teams that run on UPI.</p>
        </div>
      </div>
    </footer>
  );
}
