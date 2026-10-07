"use client";

import { ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { KoshWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { HEADER_LINKS } from "./site-links";

/** Phones and small tablets: the header links move into a slide-over menu. */
export function MobileSiteNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[85%] gap-0 pt-safe pb-safe" aria-describedby={undefined}>
        <div className="flex h-16 items-center px-4">
          <SheetTitle asChild>
            <span>
              <KoshWordmark adaptive className="w-[5.5rem]" />
            </span>
          </SheetTitle>
        </div>
        <nav aria-label="Main" className="px-2">
          <ul>
            {HEADER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={close}
                  className="flex min-h-12 items-center justify-between rounded-xl px-3 text-[0.9375rem] font-medium active:bg-muted"
                >
                  {link.label}
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mt-auto space-y-2 p-4">
          <Button asChild size="lg" className="w-full">
            <Link href="/register" onClick={close}>
              Create your company
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href="/login" onClick={close}>
              Log in
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
