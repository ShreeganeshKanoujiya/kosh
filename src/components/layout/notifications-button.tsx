"use client";

import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Activity centre. In-app notifications arrive with the approval workflow (Phase 4). */
export function NotificationsButton() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notifications" className="rounded-full">
          <Bell />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-card-title">Notifications</p>
        </div>
        <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <BellOff className="size-5" aria-hidden />
          </span>
          <p className="text-sm font-medium">You&apos;re all caught up</p>
          <p className="text-caption">Approvals and updates will show up here.</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
