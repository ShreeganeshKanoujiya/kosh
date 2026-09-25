"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/format";
import type { DuplicateCandidateDTO } from "@/types/dto";
import { EntryStatusBadge } from "./entry-status-badge";
import { Money } from "./money";

export function DuplicateDialog({
  duplicates,
  onCancel,
  onSaveAnyway,
  saving,
}: {
  duplicates: DuplicateCandidateDTO[] | null;
  onCancel: () => void;
  onSaveAnyway: () => void;
  saving: boolean;
}) {
  const first = duplicates?.[0];
  return (
    <AlertDialog open={Boolean(duplicates?.length)} onOpenChange={(o) => !o && !saving && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <span className="mb-1 inline-flex size-10 items-center justify-center rounded-full bg-warning/20 text-warning-foreground dark:text-warning">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <AlertDialogTitle>Possible duplicate</AlertDialogTitle>
          <AlertDialogDescription>A similar transaction already exists. Check before saving another.</AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="space-y-2">
          {duplicates?.map((d) => (
            <li key={d.id} className="rounded-xl border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <Money amount={d.amount} className="text-base" />
                <EntryStatusBadge status={d.status} />
              </div>
              <p className="mt-1 font-medium">{d.merchantName ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(d.entryDate)}
                {d.transactionId && ` · Transaction ID: ${d.transactionId}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Existing entry: <span className="font-mono text-foreground">{d.entryNumber}</span>
              </p>
            </li>
          ))}
        </ul>

        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
          {first && (
            <Button asChild variant="secondary" disabled={saving}>
              <Link href={`/transactions/${first.id}`} target="_blank" rel="noopener">
                View existing
              </Link>
            </Button>
          )}
          <Button onClick={onSaveAnyway} disabled={saving}>
            {saving && <Spinner />}
            Save anyway
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
