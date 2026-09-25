"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Laptop, Smartphone, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogout } from "@/hooks/use-logout";
import { api, errorMessage } from "@/lib/api-client";
import { TimeAgo } from "@/components/common/time-ago";
import { describeUserAgent, formatDateTime, isMobileUserAgent } from "@/lib/format";
import type { LoginAttemptDTO, SessionDTO } from "@/types/dto";

const FAILURE_LABELS: Record<string, string> = {
  bad_password: "Wrong password",
  unknown_user: "Unknown username",
  user_disabled: "Account disabled",
  company_inactive: "Company inactive",
};

export function SessionsList() {
  const qc = useQueryClient();
  const router = useRouter();
  const [target, setTarget] = useState<SessionDTO | null>(null);
  const { data, isPending } = useQuery({
    queryKey: ["auth", "sessions"],
    queryFn: async ({ signal }) => (await api<SessionDTO[]>("/api/auth/sessions", { signal })).data,
  });
  const revoke = useMutation({
    mutationFn: (id: string) => api<{ current: boolean }>(`/api/auth/sessions/${id}`, { method: "DELETE" }),
    onSuccess: ({ data }) => {
      if (data.current) {
        qc.clear();
        router.replace("/login?reason=logout");
        router.refresh();
      }
      else qc.invalidateQueries({ queryKey: ["auth", "sessions"] });
    },
  });

  if (isPending) return <Skeleton className="h-32 w-full rounded-xl" />;

  return (
    <>
      <ul className="divide-y rounded-xl border">
        {(data ?? []).map((s) => {
          const Icon = isMobileUserAgent(s.userAgent) ? Smartphone : Laptop;
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  {describeUserAgent(s.userAgent)}
                  {s.current && <StatusBadge tone="success">This device</StatusBadge>}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.ipAddress ?? "Unknown IP"} · Active <TimeAgo date={s.lastUsedAt} /> · Signed in {formatDateTime(s.createdAt)}
                </p>
              </div>
              {!s.current && (
                <Button variant="ghost" size="sm" onClick={() => setTarget(s)}>
                  Sign out
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      <ConfirmDialog
        open={target !== null}
        onOpenChange={(o) => !o && setTarget(null)}
        title="Sign out this device?"
        description={`${describeUserAgent(target?.userAgent ?? null)} will need to log in again.`}
        confirmLabel="Sign out device"
        destructive
        onConfirm={async () => {
          try {
            await revoke.mutateAsync(target!.id);
            toast.success("Device signed out ✓");
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </>
  );
}

export function LoginHistory() {
  const { data, isPending } = useQuery({
    queryKey: ["auth", "login-history"],
    queryFn: async ({ signal }) => (await api<LoginAttemptDTO[]>("/api/auth/login-history", { signal })).data,
  });

  if (isPending) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (!data?.length) return <p className="text-caption">No login activity yet.</p>;

  return (
    <ul className="divide-y rounded-xl border">
      {data.map((a) => (
        <li key={a.id} className="flex items-center gap-3 px-4 py-3">
          {a.success ? (
            <CheckCircle2 className="size-4 shrink-0 text-success" aria-label="Successful login" />
          ) : (
            <XCircle className="size-4 shrink-0 text-destructive" aria-label="Failed login" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              {a.success ? "Signed in" : `Failed — ${FAILURE_LABELS[a.failureReason ?? ""] ?? "Rejected"}`}
              <span className="text-muted-foreground"> · {describeUserAgent(a.userAgent)}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDateTime(a.createdAt)} · {a.ipAddress ?? "Unknown IP"}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function LogoutEverywhere() {
  const { logout } = useLogout();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Log out of all devices
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Log out of all devices?"
        description="Every session, including this one, will be signed out. You'll need to log in again everywhere."
        confirmLabel="Log out everywhere"
        destructive
        onConfirm={() => logout(true)}
      />
    </>
  );
}
