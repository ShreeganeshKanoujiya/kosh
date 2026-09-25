"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface SettingsNavItem {
  href: string;
  label: string;
}

/** Horizontal scrolling pills on phones/tablets, vertical list on desktop. */
export function SettingsNav({ items }: { items: SettingsNavItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0 lg:overflow-visible">
      <ul className="flex gap-1.5 lg:flex-col">
        {items.map((item) => {
          const active = item.href === "/settings" ? pathname === "/settings" : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center rounded-full px-4 text-sm font-medium whitespace-nowrap transition-colors lg:rounded-lg lg:px-3",
                  active ? "bg-card text-foreground shadow-xs ring-1 ring-border lg:bg-accent lg:text-accent-foreground lg:shadow-none lg:ring-0" : "text-muted-foreground hover:text-foreground lg:hover:bg-muted",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
