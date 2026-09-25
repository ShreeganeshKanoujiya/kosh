"use client";

import { ChevronRight, Ellipsis, LogOut, MonitorSmartphone } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserAvatar } from "@/components/common/user-avatar";
import { useSession } from "@/components/session-provider";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { isActivePath, visibleNavItems, type NavItem } from "@/config/navigation";
import { useLogout } from "@/hooks/use-logout";
import { cn } from "@/lib/utils";
import { NAV_ICONS } from "./nav-icon";
import { QuickAddSheet, useCanQuickAdd } from "./quick-add";
import { ThemeSwitch } from "./theme-switch";

// Preferred order for the four tab slots around the central "+".
const TAB_PRIORITY = ["/dashboard", "/transactions", "/reports", "/approvals", "/users", "/categories"];

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = NAV_ICONS[item.icon];
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium transition-colors",
        active ? "text-primary" : "text-muted-foreground active:text-foreground",
      )}
    >
      <Icon className="size-6" strokeWidth={active ? 2.2 : 1.8} aria-hidden />
      {item.shortLabel}
    </Link>
  );
}

/** Apple-style bottom tab bar: Home · Transactions · [+] · Reports · More. Mobile only. */
export function MobileTabBar() {
  const me = useSession();
  const pathname = usePathname();
  const canAdd = useCanQuickAdd();
  const [moreOpen, setMoreOpen] = useState(false);
  const { logout, pending } = useLogout();

  const visible = visibleNavItems(me.permissions);
  const tabs = TAB_PRIORITY.map((href) => visible.find((i) => i.href === href)).filter(Boolean).slice(0, canAdd ? 3 : 4) as NavItem[];
  const overflow = visible.filter((i) => !tabs.includes(i));
  const left = canAdd ? tabs.slice(0, 2) : tabs;
  const right = canAdd ? tabs.slice(2) : [];
  const moreActive = overflow.some((i) => isActivePath(pathname, i.href));

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 pb-safe backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto flex h-(--tab-bar-height) max-w-lg items-stretch px-2">
        {left.map((item) => (
          <TabLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
        ))}
        {canAdd && (
          <div className="flex flex-1 items-start justify-center">
            <QuickAddSheet />
          </div>
        )}
        {right.map((item) => (
          <TabLink key={item.href} item={item} active={isActivePath(pathname, item.href)} />
        ))}

        <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium",
                moreActive || moreOpen ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Ellipsis className="size-6" aria-hidden />
              More
            </button>
          </DrawerTrigger>
          <DrawerContent className="pb-safe">
            <DrawerTitle className="sr-only">More</DrawerTitle>
            <div className="max-h-[75vh] space-y-5 overflow-y-auto px-4 pt-4 pb-6">
              <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-4">
                <UserAvatar name={me.user.fullName} seed={me.user.id} className="size-11" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{me.user.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {me.role.name} · {me.company.name} · <span className="font-mono">{me.company.code}</span>
                  </p>
                </div>
              </div>

              {overflow.length > 0 && (
                <ul className="divide-y overflow-hidden rounded-2xl bg-muted/60">
                  {overflow.map((item) => {
                    const Icon = NAV_ICONS[item.icon];
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className="flex min-h-13 items-center gap-3 px-4 active:bg-muted"
                        >
                          <Icon className="size-5 text-muted-foreground" aria-hidden />
                          <span className="flex-1 text-[0.9375rem]">{item.label}</span>
                          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="space-y-2">
                <p className="px-1 text-meta font-medium uppercase">Appearance</p>
                <ThemeSwitch />
              </div>

              <ul className="divide-y overflow-hidden rounded-2xl bg-muted/60">
                <li>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => logout(false)}
                    className="flex min-h-13 w-full items-center gap-3 px-4 text-left text-destructive active:bg-muted"
                  >
                    <LogOut className="size-5" aria-hidden />
                    <span className="text-[0.9375rem]">Log out</span>
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => logout(true)}
                    className="flex min-h-13 w-full items-center gap-3 px-4 text-left active:bg-muted"
                  >
                    <MonitorSmartphone className="size-5 text-muted-foreground" aria-hidden />
                    <span className="text-[0.9375rem]">Log out of all devices</span>
                  </button>
                </li>
              </ul>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </nav>
  );
}
