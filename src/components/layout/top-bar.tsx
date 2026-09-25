"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/components/session-provider";
import { Input } from "@/components/ui/input";
import { AVAILABLE_ROUTES } from "@/config/navigation";
import { NotificationsButton } from "./notifications-button";
import { QuickAddButton } from "./quick-add";
import { UserMenu } from "./user-menu";

/** Tablet/desktop header: search · quick add · notifications · profile. */
export function TopBar() {
  const me = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const searchEnabled = AVAILABLE_ROUTES.has("/transactions") && me.can("transactions.read");

  return (
    <header className="sticky top-0 z-30 hidden h-16 items-center gap-3 border-b bg-background/85 px-6 backdrop-blur-md md:flex lg:px-8">
      {searchEnabled ? (
        <form
          role="search"
          className="relative w-full max-w-md"
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            router.push(q ? `/transactions?search=${encodeURIComponent(q)}` : "/transactions");
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entries, merchants, UPI IDs…"
            aria-label="Search transactions"
            className="h-10 rounded-full border-transparent bg-muted pl-9 focus-visible:border-ring focus-visible:bg-card"
          />
        </form>
      ) : null}
      <div className="ml-auto flex items-center gap-2">
        <QuickAddButton />
        <NotificationsButton />
        <UserMenu />
      </div>
    </header>
  );
}
