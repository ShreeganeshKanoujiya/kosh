"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand/logo";
import { useSession } from "@/components/session-provider";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { isActivePath, visibleNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { NAV_ICONS } from "./nav-icon";
import { UserMenu } from "./user-menu";

/**
 * Desktop (lg+): persistent 256px sidebar with labels.
 * Tablet (md–lg): 80px rail with icon + short label.
 * Mobile: not rendered — the bottom tab bar takes over.
 */
export function Sidebar() {
  const me = useSession();
  const pathname = usePathname();
  const items = visibleNavItems(me.permissions);

  return (
    <aside
      aria-label="Primary"
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex md:w-20 lg:w-64"
    >
      <div className="flex h-16 items-center gap-3 px-4 md:justify-center lg:justify-start lg:px-5">
        <LogoMark className="size-9" />
        <div className="hidden min-w-0 lg:block">
          <p className="truncate text-sm font-semibold text-foreground">{me.company.name}</p>
          <p className="font-mono text-xs tracking-wider text-muted-foreground">{me.company.code}</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 lg:px-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = NAV_ICONS[item.icon];
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center rounded-xl text-sm font-medium transition-colors",
                        "min-h-14 flex-col justify-center gap-1 px-1 py-2 md:flex lg:min-h-10 lg:flex-row lg:justify-start lg:gap-3 lg:px-3",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )}
                    >
                      <Icon className={cn("size-5 shrink-0 lg:size-[1.125rem]", active && "text-sidebar-primary")} aria-hidden />
                      <span className="text-[0.6875rem] leading-none lg:text-sm lg:leading-normal">
                        <span className="lg:hidden">{item.shortLabel}</span>
                        <span className="hidden lg:inline">{item.label}</span>
                      </span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="lg:hidden">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-2 lg:p-3">
        <div className="hidden lg:block">
          <UserMenu variant="sidebar" />
        </div>
        <div className="flex justify-center lg:hidden">
          <UserMenu />
        </div>
      </div>
    </aside>
  );
}
