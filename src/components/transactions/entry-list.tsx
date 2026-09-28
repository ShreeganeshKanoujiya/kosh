"use client";

import { ChevronRight, Paperclip, Pencil } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENTRY_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/config/entries";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EntryDTO } from "@/types/dto";
import { EntryStatusBadge } from "./entry-status-badge";
import { Money } from "./money";

/** Paperclip shown on rows that carry a receipt or screenshot. */
function AttachmentMark({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="inline-flex shrink-0 items-center text-muted-foreground" title={`${count} attached`}>
      <Paperclip className="size-3.5" aria-hidden />
      <span className="sr-only">, {count} attached</span>
    </span>
  );
}

export const entryTitle = (e: EntryDTO) => e.merchantName ?? e.description ?? e.category?.name ?? ENTRY_TYPE_LABELS[e.type];

function dayLabel(ymd: string, today: string) {
  if (ymd === today) return "Today";
  const y = new Date(`${today}T00:00:00Z`);
  y.setUTCDate(y.getUTCDate() - 1);
  if (ymd === y.toISOString().slice(0, 10)) return "Yesterday";
  return new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${ymd}T00:00:00Z`),
  );
}

/** Desktop / tablet: a scannable table. The whole row is one link target. */
export function EntryTable({ items }: { items: EntryDTO[] }) {
  return (
    <Card className="overflow-hidden p-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-28 pl-5">Date</TableHead>
            <TableHead>Transaction</TableHead>
            <TableHead className="hidden lg:table-cell">Category</TableHead>
            <TableHead className="hidden xl:table-cell">Created by</TableHead>
            <TableHead className="hidden lg:table-cell">Payment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="pr-5 text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((e) => (
            <TableRow key={e.id} className="relative cursor-pointer">
              <TableCell className="pl-5 text-muted-foreground tabular-nums">{formatDate(e.entryDate)}</TableCell>
              <TableCell className="max-w-72">
                <span className="flex items-center gap-1.5">
                  <Link href={`/transactions/${e.id}`} className="block truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline">
                    {entryTitle(e)}
                  </Link>
                  <AttachmentMark count={e.attachmentCount} />
                </span>
                <span className="block truncate font-mono text-xs text-muted-foreground">{e.entryNumber}</span>
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{e.category?.name ?? "—"}</TableCell>
              <TableCell className="hidden text-muted-foreground xl:table-cell">{e.createdBy.fullName}</TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{PAYMENT_METHOD_LABELS[e.paymentMethod]}</TableCell>
              <TableCell>
                <EntryStatusBadge status={e.status} />
              </TableCell>
              <TableCell className="pr-5 text-right">
                <Money amount={e.amount} currency={e.currency} type={e.type} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

const ACTION_WIDTH = 88;

/**
 * Swipe a row left to reveal Edit (touch only; nothing destructive lives here). Tapping the row
 * still opens it. Keyboard and screen-reader users reach the same Edit link by tabbing to it.
 */
function SwipeRow({ entry, children }: { entry: EntryDTO; children: React.ReactNode }) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; base: number; horizontal: boolean | null } | null>(null);
  const suppressClick = useRef(false);

  if (!entry.allowedActions.includes("edit")) return <li>{children}</li>;

  const settle = (to: number) => {
    drag.current = null;
    setDragging(false);
    setOffset(to);
  };

  return (
    <li className="relative overflow-hidden">
      <div
        style={{ transform: `translateX(${offset}px)` }}
        className={cn("relative z-10 bg-card touch-pan-y", !dragging && "transition-transform duration-200 ease-out motion-reduce:transition-none")}
        onPointerDown={(e) => {
          if (e.pointerType !== "touch") return;
          drag.current = { x: e.clientX, y: e.clientY, base: offset, horizontal: null };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (d.horizontal === null) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            d.horizontal = Math.abs(dx) > Math.abs(dy);
            if (!d.horizontal) {
              drag.current = null; // a vertical scroll: leave it to the browser
              return;
            }
            setDragging(true);
          }
          suppressClick.current = true;
          setOffset(Math.max(-ACTION_WIDTH, Math.min(0, d.base + dx)));
        }}
        onPointerUp={() => drag.current?.horizontal && settle(offset < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0)}
        onPointerCancel={() => drag.current && settle(offset < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0)}
        onClickCapture={(e) => {
          // The end of a swipe isn't a tap; a tap on an open row just closes it.
          if (suppressClick.current || offset !== 0) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
            if (offset !== 0 && !dragging) setOffset(0);
          }
        }}
      >
        {children}
      </div>
      <Link
        href={`/transactions/${entry.id}/edit`}
        aria-label={`Edit ${entry.entryNumber}`}
        onFocus={() => setOffset(-ACTION_WIDTH)}
        onBlur={() => setOffset(0)}
        style={{ width: ACTION_WIDTH }}
        className="absolute inset-y-0 right-0 flex flex-col items-center justify-center gap-1 bg-primary text-xs font-medium text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-primary-foreground/70 focus-visible:ring-inset"
      >
        <Pencil className="size-5" aria-hidden />
        Edit
      </Link>
    </li>
  );
}

/** Phone: cards grouped by day, like a banking app statement. */
export function EntryCards({ items, today }: { items: EntryDTO[]; today: string }) {
  const groups: { date: string; items: EntryDTO[] }[] = [];
  for (const e of items) {
    const last = groups.at(-1);
    if (last && last.date === e.entryDate) last.items.push(e);
    else groups.push({ date: e.entryDate, items: [e] });
  }
  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.date} aria-label={dayLabel(g.date, today)}>
          <h2 className="mb-2 px-1 text-meta font-medium tracking-wide uppercase">{dayLabel(g.date, today)}</h2>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {g.items.map((e) => (
              <SwipeRow key={e.id} entry={e}>
                <Link href={`/transactions/${e.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-muted">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-medium">{entryTitle(e)}</p>
                      <Money amount={e.amount} currency={e.currency} type={e.type} className="shrink-0" />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-3">
                      <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="truncate">
                          {e.category?.name ?? ENTRY_TYPE_LABELS[e.type]} · {PAYMENT_METHOD_LABELS[e.paymentMethod]}
                        </span>
                        <AttachmentMark count={e.attachmentCount} />
                      </p>
                      <EntryStatusBadge status={e.status} className="shrink-0" />
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </SwipeRow>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
