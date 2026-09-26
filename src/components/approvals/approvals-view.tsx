"use client";

import { CheckCircle2, Paperclip, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { EntryActions } from "@/components/transactions/entry-actions";
import { EntryStatusBadge } from "@/components/transactions/entry-status-badge";
import { entryTitle } from "@/components/transactions/entry-list";
import { Money } from "@/components/transactions/money";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { APPROVAL_QUERY, PAYMENT_METHOD_LABELS } from "@/config/entries";
import { useEntries } from "@/hooks/use-entries";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EntryDTO, EntryListDTO } from "@/types/dto";


const reviewable = (e: EntryDTO) => e.allowedActions.some((a) => a === "approve" || a === "reject" || a === "verify");

function ApprovalCard({ entry }: { entry: EntryDTO }) {
  const mine = !reviewable(entry);
  return (
    <Card className="gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Money amount={entry.amount} currency={entry.currency} type={entry.type} className="text-2xl" />
          <p className="mt-1 truncate font-medium">{entryTitle(entry)}</p>
          <p className="text-caption">{entry.category?.name ?? "No category"}</p>
        </div>
        <EntryStatusBadge status={entry.status} />
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-meta">Created by</dt>
          <dd className="flex items-center gap-1.5 truncate">
            <UserRound className="size-3.5 text-muted-foreground" aria-hidden />
            {entry.createdBy.fullName}
          </dd>
        </div>
        <div>
          <dt className="text-meta">Date</dt>
          <dd>{formatDate(entry.entryDate)}</dd>
        </div>
        <div>
          <dt className="text-meta">Payment</dt>
          <dd>{PAYMENT_METHOD_LABELS[entry.paymentMethod]}</dd>
        </div>
        <div>
          <dt className="text-meta">Receipt</dt>
          <dd className="flex items-center gap-1.5">
            <Paperclip className="size-3.5 text-muted-foreground" aria-hidden />
            {entry.attachmentCount ? `${entry.attachmentCount} attached` : "None"}
          </dd>
        </div>
      </dl>
      {entry.description && entry.merchantName && <p className="text-caption line-clamp-2">{entry.description}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <Link href={`/transactions/${entry.id}`} className="text-sm font-medium text-primary hover:underline">
          {entry.entryNumber}
        </Link>
        {mine ? <p className="text-meta">Awaiting another reviewer</p> : <EntryActions entry={entry} />}
      </div>
    </Card>
  );
}

export function ApprovalsView({ initialData }: { initialData: EntryListDTO }) {
  const [tab, setTab] = useState<"mine" | "all">("mine");
  const { data, isPending, isFetching } = useEntries(APPROVAL_QUERY, initialData);
  const all = data?.items ?? [];
  const forMe = all.filter(reviewable);
  const items = tab === "mine" ? forMe : all;

  return (
    <>
      <PageHeader title="Approvals" description="Review submitted petty cash entries. Oldest first." />

      <div role="tablist" aria-label="Approval queue" className="mb-4 inline-flex rounded-xl bg-muted p-1">
        {(
          [
            ["mine", `Needs your review`, forMe.length],
            ["all", "All pending", all.length],
          ] as const
        ).map(([value, label, count]) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-muted-foreground md:h-9",
              tab === value && "bg-card text-foreground shadow-xs",
            )}
          >
            {label}
            <span className="rounded-full bg-background px-2 text-xs tabular-nums">{count}</span>
          </button>
        ))}
      </div>

      {isPending ? (
        <div className="grid gap-3 md:grid-cols-2" role="status" aria-label="Loading approvals">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="You're all caught up"
          description={tab === "mine" ? "Nothing is waiting for your review." : "No entries are awaiting approval."}
        />
      ) : (
        <div className={cn("grid gap-3 md:grid-cols-2 xl:grid-cols-3", isFetching && "opacity-70")} aria-busy={isFetching}>
          {items.map((e) => (
            <ApprovalCard key={e.id} entry={e} />
          ))}
        </div>
      )}
    </>
  );
}
