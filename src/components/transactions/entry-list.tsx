"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ENTRY_TYPE_LABELS, PAYMENT_METHOD_LABELS } from "@/config/entries";
import { formatDate } from "@/lib/format";
import type { EntryDTO } from "@/types/dto";
import { EntryStatusBadge } from "./entry-status-badge";
import { Money } from "./money";

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
                <Link href={`/transactions/${e.id}`} className="block truncate font-medium outline-none after:absolute after:inset-0 focus-visible:underline">
                  {entryTitle(e)}
                </Link>
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
              <li key={e.id}>
                <Link href={`/transactions/${e.id}`} className="flex min-h-16 items-center gap-3 px-4 py-3 active:bg-muted">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate font-medium">{entryTitle(e)}</p>
                      <Money amount={e.amount} currency={e.currency} type={e.type} className="shrink-0" />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-3">
                      <p className="truncate text-xs text-muted-foreground">
                        {e.category?.name ?? ENTRY_TYPE_LABELS[e.type]} · {PAYMENT_METHOD_LABELS[e.paymentMethod]}
                      </p>
                      <EntryStatusBadge status={e.status} className="shrink-0" />
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
