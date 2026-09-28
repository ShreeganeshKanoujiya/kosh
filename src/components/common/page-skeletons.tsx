import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Shown while a page's data loads after navigation, so taps never feel ignored. */
function Loading({ children, label = "Loading" }: { children: React.ReactNode; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}…</span>
      <div aria-hidden>{children}</div>
    </div>
  );
}

function HeaderSkeleton({ narrow }: { narrow?: boolean }) {
  return (
    <div className={narrow ? "mx-auto mb-6 max-w-2xl space-y-2" : "mb-6 space-y-2"}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-56" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <Loading label="Loading dashboard">
      <HeaderSkeleton />
      <Skeleton className="mb-4 h-40 rounded-2xl" />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    </Loading>
  );
}

export function ListSkeleton() {
  return (
    <Loading label="Loading transactions">
      <HeaderSkeleton />
      <div className="mb-4 flex gap-2 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-24 shrink-0 rounded-full pointer-fine:md:h-9" />
        ))}
      </div>
      <Card className="gap-0 divide-y p-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </Card>
    </Loading>
  );
}

export function DetailSkeleton() {
  return (
    <Loading label="Loading transaction">
      <HeaderSkeleton />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        <div className="space-y-4">
          <Card className="items-center gap-3 px-6 py-8">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-11 w-44" />
            <Skeleton className="h-5 w-32" />
          </Card>
          <Card className="gap-4 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </Card>
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </Loading>
  );
}

export function FormSkeleton() {
  return (
    <Loading label="Loading form">
      <HeaderSkeleton narrow />
      <Card className="mx-auto max-w-2xl gap-6 p-5 md:p-7">
        <Skeleton className="h-11 rounded-xl" />
        <Skeleton className="mx-auto h-14 w-40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11" />
          </div>
        ))}
      </Card>
    </Loading>
  );
}
