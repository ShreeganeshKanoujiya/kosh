"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronLeft, ChevronRight, ScrollText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AUDIT_ENTITY_LABELS, auditLabel } from "@/config/audit";
import { api } from "@/lib/api-client";
import { describeUserAgent, formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types/api";
import type { AuditLogDTO } from "@/types/dto";

const ALL = "all";

/** Old → new values for fields that changed, flattened for display. */
export function changedFields(oldValues: unknown, newValues: unknown) {
  const o = (oldValues && typeof oldValues === "object" ? oldValues : {}) as Record<string, unknown>;
  const n = (newValues && typeof newValues === "object" ? newValues : {}) as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(o), ...Object.keys(n)])];
  const show = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
  return keys
    .filter((k) => JSON.stringify(o[k]) !== JSON.stringify(n[k]))
    .map((k) => ({ field: k, from: k in o ? show(o[k]) : null, to: k in n ? show(n[k]) : null }));
}

function AuditRow({ item }: { item: AuditLogDTO }) {
  const [open, setOpen] = useState(false);
  const changes = changedFields(item.oldValues, item.newValues);
  const entityHref = item.entityType === "transaction" && item.entityId && item.action !== "transaction.deleted" ? `/transactions/${item.entityId}` : null;
  return (
    <li className="px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">
            {auditLabel(item.action)}
            <span className="font-normal text-muted-foreground"> · {AUDIT_ENTITY_LABELS[item.entityType] ?? item.entityType}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {item.user ? `${item.user.fullName} (@${item.user.username})` : "System"} · {formatDateTime(item.createdAt)}
            {item.ipAddress && ` · ${item.ipAddress}`}
            {item.userAgent && ` · ${describeUserAgent(item.userAgent)}`}
          </p>
          {entityHref && (
            <Link href={entityHref} className="text-xs font-medium text-primary hover:underline">
              View transaction
            </Link>
          )}
        </div>
        {changes.length > 0 && (
          <Button variant="ghost" size="sm" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            {changes.length} change{changes.length === 1 ? "" : "s"}
            <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          </Button>
        )}
      </div>
      {open && (
        <dl className="mt-3 grid gap-1.5 rounded-lg bg-muted/50 p-3 text-xs">
          {changes.map((c) => (
            <div key={c.field} className="grid grid-cols-[8rem_1fr] gap-2">
              <dt className="font-medium text-muted-foreground">{c.field}</dt>
              <dd className="break-all">
                {c.from !== null && <span className="text-destructive line-through decoration-destructive/40">{c.from}</span>}
                {c.from !== null && c.to !== null && " → "}
                {c.to !== null && <span className="text-foreground">{c.to}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

export function AuditLogView() {
  const [entityType, setEntityType] = useState(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const qs = new URLSearchParams({ page: String(page), pageSize: "30" });
  if (entityType !== ALL) qs.set("entityType", entityType);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);

  const { data, isPending, isFetching } = useQuery({
    queryKey: ["audit-logs", qs.toString()],
    queryFn: async ({ signal }) => (await api<Paginated<AuditLogDTO>>(`/api/audit-logs?${qs}`, { signal })).data,
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          value={entityType}
          onValueChange={(v) => {
            setEntityType(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full" aria-label="Area">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Everything</SelectItem>
            {Object.entries(AUDIT_ENTITY_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="date" aria-label="From" value={from} onChange={(e) => (setFrom(e.target.value), setPage(1))} />
        <Input type="date" aria-label="To" value={to} onChange={(e) => (setTo(e.target.value), setPage(1))} />
      </div>

      {isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : !data?.items.length ? (
        <EmptyState icon={ScrollText} title="No activity found" description="Try a different area or date range." />
      ) : (
        <div className={cn(isFetching && "opacity-70")}>
          <ul className="divide-y rounded-xl border">
            {data.items.map((item) => (
              <AuditRow key={item.id} item={item} />
            ))}
          </ul>
          {data.totalPages > 1 && (
            <nav className="mt-3 flex items-center justify-between" aria-label="Pagination">
              <p className="text-caption">
                Page {data.page} of {data.totalPages} · {data.total} events
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                  <ChevronLeft />
                </Button>
                <Button variant="outline" size="icon" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                  <ChevronRight />
                </Button>
              </div>
            </nav>
          )}
        </div>
      )}
      <p className="text-caption">The audit trail is append-only — entries can&apos;t be edited or deleted, even by the owner.</p>
    </div>
  );
}
