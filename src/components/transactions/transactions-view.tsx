"use client";

import { ArrowDownUp, ChevronLeft, ChevronRight, Plus, ReceiptText, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { ExportMenu } from "@/components/reports/export-menu";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ENTRY_PAGE_SIZE as PAGE_SIZE } from "@/config/entries";
import { useEntries, type EntryQuery } from "@/hooks/use-entries";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DATE_PRESETS, matchPreset, presetRange, todayYmd, type DatePreset } from "@/lib/dates";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EntryListDTO } from "@/types/dto";
import { EntryCards, EntryTable } from "./entry-list";
import { SHEET_FILTER_KEYS, TransactionFilters } from "./transaction-filters";

const SORTS = [
  { value: "date_desc", label: "Newest first" },
  { value: "date_asc", label: "Oldest first" },
  { value: "amount_desc", label: "Highest amount" },
  { value: "amount_asc", label: "Lowest amount" },
];

export function TransactionsView({
  initialQuery,
  initialData,
  sheetsEnabled,
}: {
  initialQuery: EntryQuery;
  initialData: EntryListDTO;
  sheetsEnabled: boolean;
}) {
  const me = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const query: EntryQuery = Object.fromEntries(params.entries());
  const today = todayYmd(me.company.timezone);

  // Search box is local state, pushed to the URL after typing pauses.
  const [search, setSearch] = useState(query.search ?? "");
  const debounced = useDebouncedValue(search.trim(), 300);

  const setQuery = (patch: Partial<EntryQuery>, { resetPage = true } = {}) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    if (resetPage) next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => {
    if ((query.search ?? "") !== debounced) setQuery({ search: debounced });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced value
  }, [debounced]);

  const isInitial = params.toString() === new URLSearchParams(initialQuery).toString();
  const { data, isPending, isFetching } = useEntries({ pageSize: String(PAGE_SIZE), ...query }, isInitial ? initialData : undefined);

  const preset = matchPreset(query.from, query.to, today);
  const customRange = !preset && (query.from || query.to);
  const hasFilters = Boolean(query.search || query.from || query.to || SHEET_FILTER_KEYS.some((k) => query[k]));
  const page = Number(query.page ?? 1);

  const choosePreset = (p: DatePreset | null) => setQuery(p ? presetRange(p, today) : { from: "", to: "" });

  // Export every matching entry (not just this page) with exactly these filters.
  const exportQuery = new URLSearchParams(Object.entries(query).filter(([k, v]) => v && k !== "page" && k !== "pageSize")).toString();

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every petty cash entry, newest first."
        actions={
          me.can("reports.export") && (data?.total ?? 0) > 0 && <ExportMenu source="transactions" query={exportQuery} sheetsEnabled={sheetsEnabled} />
        }
      />

      <div className="mb-3 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search number, merchant, UPI ID, user…"
            aria-label="Search transactions"
            className="pl-9"
          />
        </div>
        <TransactionFilters query={query} onApply={(patch) => setQuery(patch)} />
        <Select value={query.sort ?? "date_desc"} onValueChange={(v) => setQuery({ sort: v === "date_desc" ? "" : v })}>
          <SelectTrigger className="hidden w-44 sm:flex" aria-label="Sort">
            <ArrowDownUp className="size-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick date filters */}
      <div role="group" aria-label="Date range" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {[{ value: null, label: "All time" }, ...DATE_PRESETS].map((p) => {
          const active = p.value === null ? !query.from && !query.to : preset === p.value;
          return (
            <button
              key={p.label}
              type="button"
              aria-pressed={active}
              onClick={() => choosePreset(p.value)}
              className={cn(
                "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors",
                active ? "border-primary bg-accent text-accent-foreground" : "bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          );
        })}
        {customRange && (
          <span className="inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-primary bg-accent pr-1 pl-4 text-sm font-medium text-accent-foreground">
            {query.from ? formatDate(query.from) : "…"} – {query.to ? formatDate(query.to) : "…"}
            <button type="button" aria-label="Clear custom range" onClick={() => choosePreset(null)} className="inline-flex size-7 items-center justify-center rounded-full hover:bg-background/60">
              <X className="size-3.5" />
            </button>
          </span>
        )}
      </div>

      {isPending ? (
        <div className="space-y-2" role="status" aria-label="Loading transactions">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={hasFilters ? "No matching transactions" : "No transactions yet"}
          description={hasFilters ? "Try a different search or clear the filters." : "Start recording your petty cash expenses."}
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={() => router.replace(pathname)}>
                Clear filters
              </Button>
            ) : (
              me.can("transactions.create") && (
                <Button asChild>
                  <Link href="/transactions/new?mode=manual">
                    <Plus />
                    Add transaction
                  </Link>
                </Button>
              )
            )
          }
        />
      ) : (
        <div className={cn("transition-opacity", isFetching && "opacity-60")} aria-busy={isFetching}>
          <dl className="mb-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 px-1 text-sm">
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Entries</dt>
              <dd className="font-medium tabular-nums">{data.summary.count}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted-foreground">Spent</dt>
              <dd className="font-medium tabular-nums">{formatCurrency(data.summary.expenseTotal, me.company.currency)}</dd>
            </div>
            {Number(data.summary.incomeTotal) > 0 && (
              <div className="flex gap-1.5">
                <dt className="text-muted-foreground">Cash added</dt>
                <dd className="font-medium text-success tabular-nums">+{formatCurrency(data.summary.incomeTotal, me.company.currency)}</dd>
              </div>
            )}
          </dl>

          <div className="hidden md:block">
            <EntryTable items={data.items} />
          </div>
          <div className="md:hidden">
            <EntryCards items={data.items} today={today} />
          </div>

          {data.totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
              <p className="text-caption">
                Page {data.page} of {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setQuery({ page: String(page - 1) }, { resetPage: false })} aria-label="Previous page">
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= data.totalPages}
                  onClick={() => setQuery({ page: String(page + 1) }, { resetPage: false })}
                  aria-label="Next page"
                >
                  <ChevronRight />
                </Button>
              </div>
            </nav>
          )}
        </div>
      )}
    </>
  );
}
