"use client";

import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TimeAgo } from "@/components/common/time-ago";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarkNotificationsRead, useNotifications, type NotificationItem } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

function hrefFor(n: NotificationItem) {
  return n.entityType === "transaction" && n.entityId ? `/transactions/${n.entityId}` : null;
}

/** Activity centre: in-app notifications (approvals, rejections, submissions). */
export function NotificationsButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { data } = useNotifications();
  const markRead = useMarkNotificationsRead();
  const unread = data?.unread ?? 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"} className="relative rounded-full">
          <Bell />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[0.625rem] leading-4 font-semibold text-white" aria-hidden>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-card-title">Notifications</p>
          {unread > 0 && (
            <Button variant="ghost" size="sm" onClick={() => markRead.mutate({ all: true })} disabled={markRead.isPending}>
              <CheckCheck />
              Mark all read
            </Button>
          )}
        </div>
        {!data?.items.length ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BellOff className="size-5" aria-hidden />
            </span>
            <p className="text-sm font-medium">You&apos;re all caught up</p>
            <p className="text-caption">Approvals and updates will show up here.</p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {data.items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!n.read) markRead.mutate({ ids: [n.id] });
                      const href = hrefFor(n);
                      if (href) {
                        setOpen(false);
                        router.push(href);
                      }
                    }}
                    className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-muted/60", !n.read && "bg-accent/40")}
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">
                        {n.title}
                        {!n.read && <span className="sr-only"> (unread)</span>}
                      </span>
                      {n.body && <span className="block truncate text-xs text-muted-foreground">{n.body}</span>}
                      <span className="block text-xs text-muted-foreground">
                        <TimeAgo date={n.createdAt} />
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
