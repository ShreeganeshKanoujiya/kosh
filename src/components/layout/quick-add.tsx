"use client";

import { ChevronRight, PenLine, Plus, ScanLine, Paperclip } from "lucide-react";
import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { AVAILABLE_ROUTES } from "@/config/navigation";
import { cn } from "@/lib/utils";

export const QUICK_ACTIONS = [
  { href: "/transactions/new?mode=scan", label: "Scan UPI screenshot", hint: "Auto-fill from GPay, PhonePe, Paytm…", icon: ScanLine },
  { href: "/transactions/new?mode=manual", label: "Manual entry", hint: "Type in amount, category and details", icon: PenLine },
  { href: "/transactions/new?mode=receipt", label: "Upload receipt", hint: "Attach a bill or invoice", icon: Paperclip },
] as const;

export function useCanQuickAdd() {
  const me = useSession();
  return AVAILABLE_ROUTES.has("/transactions") && me.can("transactions.create");
}

/** Desktop: "+ Add transaction" with a menu of entry methods. */
export function QuickAddButton() {
  const enabled = useCanQuickAdd();
  if (!enabled) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="rounded-full">
          <Plus />
          Add transaction
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {QUICK_ACTIONS.map(({ href, label, hint, icon: Icon }) => (
          <DropdownMenuItem key={href} asChild className="py-2.5">
            <Link href={href}>
              <Icon />
              <span>
                <span className="block font-medium">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Mobile: the central tab-bar "+" opens a native-feeling action sheet. */
export function QuickAddSheet({ className }: { className?: string }) {
  const enabled = useCanQuickAdd();
  if (!enabled) return null;
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <button
          type="button"
          aria-label="Add transaction"
          className={cn(
            "flex size-14 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95",
            className,
          )}
        >
          <Plus className="size-7" strokeWidth={2.4} aria-hidden />
        </button>
      </DrawerTrigger>
      <DrawerContent className="pb-safe">
        <DrawerHeader>
          <DrawerTitle>Add transaction</DrawerTitle>
          <DrawerDescription>Choose how you want to record it.</DrawerDescription>
        </DrawerHeader>
        <ul className="space-y-2 px-4 pb-6">
          {QUICK_ACTIONS.map(({ href, label, hint, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex min-h-16 items-center gap-4 rounded-2xl bg-muted/60 px-4 py-3 active:bg-muted"
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-card text-primary shadow-xs">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span className="flex-1">
                  <span className="block text-[0.9375rem] font-medium">{label}</span>
                  <span className="block text-xs text-muted-foreground">{hint}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </DrawerContent>
    </Drawer>
  );
}
