"use client";

import { LogoMark } from "@/components/brand/logo";
import { useSession } from "@/components/session-provider";
import { NotificationsButton } from "./notifications-button";
import { UserMenu } from "./user-menu";

/** Compact mobile app bar. Pages render their own large title below it. */
export function MobileHeader() {
  const me = useSession();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 pt-safe backdrop-blur-md md:hidden">
      <div className="flex h-14 items-center gap-2.5 px-4">
        <LogoMark className="size-7" />
        <p className="min-w-0 flex-1 truncate text-[0.9375rem] font-semibold">{me.company.name}</p>
        <NotificationsButton />
        <UserMenu />
      </div>
    </header>
  );
}
