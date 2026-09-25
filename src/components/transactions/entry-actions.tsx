"use client";

import { Ban, Check, CheckCheck, Pencil, Send, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogFooter } from "@/components/common/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useEntryMutations } from "@/hooks/use-entries";
import { ApiClientError, errorMessage } from "@/lib/api-client";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EntryDTO } from "@/types/dto";

type Confirm = "approve" | "cancel" | "delete" | null;

/**
 * Action bar driven entirely by `entry.allowedActions` (computed server-side).
 * Destructive actions always confirm; rejection always asks for a reason.
 */
export function EntryActions({ entry, layout = "bar" }: { entry: EntryDTO; layout?: "bar" | "stack" }) {
  const router = useRouter();
  const { transition, reject, remove } = useEntryMutations();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const can = (a: EntryDTO["allowedActions"][number]) => entry.allowedActions.includes(a);
  const amount = formatCurrency(Math.abs(Number(entry.amount)), entry.currency);
  const busy = transition.isPending || reject.isPending || remove.isPending;

  const handle = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      toast.success(success);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.code === "VERSION_CONFLICT") {
        toast.error(error.message, { action: { label: "Reload", onClick: () => router.refresh() } });
      } else {
        toast.error(errorMessage(error));
      }
    }
  };
  const run = (action: "submit" | "verify" | "approve" | "cancel", success: string) =>
    handle(() => transition.mutateAsync({ id: entry.id, action, version: entry.version }), success);

  if (entry.allowedActions.length === 0) return null;

  const primary = can("approve") ? (
    <Button onClick={() => setConfirm("approve")} disabled={busy} className="flex-1 sm:flex-none">
      <Check />
      Approve
    </Button>
  ) : can("submit") ? (
    <Button onClick={() => run("submit", "Transaction submitted ✓")} disabled={busy} className="flex-1 sm:flex-none">
      {transition.isPending ? <Spinner /> : <Send />}
      Submit
    </Button>
  ) : null;

  return (
    <>
      <div className={cn("flex flex-wrap gap-2", layout === "stack" && "flex-col [&>*]:w-full")}>
        {can("reject") && (
          <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={busy} className="flex-1 sm:flex-none">
            <X />
            Reject
          </Button>
        )}
        {can("verify") && (
          <Button variant="secondary" onClick={() => run("verify", "Transaction verified ✓")} disabled={busy} className="flex-1 sm:flex-none">
            <CheckCheck />
            Verify
          </Button>
        )}
        {can("edit") && (
          <Button asChild variant="secondary" className="flex-1 sm:flex-none">
            <Link href={`/transactions/${entry.id}/edit`}>
              <Pencil />
              Edit
            </Link>
          </Button>
        )}
        {can("cancel") && (
          <Button variant="ghost" onClick={() => setConfirm("cancel")} disabled={busy}>
            <Ban />
            Cancel entry
          </Button>
        )}
        {can("delete") && (
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirm("delete")} disabled={busy}>
            <Trash2 />
            Delete
          </Button>
        )}
        {primary}
      </div>

      <ConfirmDialog
        open={confirm === "approve"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Approve ${amount}?`}
        description={
          entry.type === "expense"
            ? `This deducts ${amount} from ${entry.cashAccount.name}. Approved entries can't be edited.`
            : `This updates the ${entry.cashAccount.name} balance. Approved entries can't be edited.`
        }
        confirmLabel="Approve"
        onConfirm={() => run("approve", "Transaction approved ✓")}
      />
      <ConfirmDialog
        open={confirm === "cancel"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Cancel this entry?"
        description="It stays in the history as cancelled and won't affect the balance."
        confirmLabel="Cancel entry"
        destructive
        onConfirm={() => run("cancel", "Transaction cancelled")}
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Delete ${entry.entryNumber}?`}
        description="It will be removed from lists and reports. The audit trail keeps a record of the deletion."
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          handle(async () => {
            await remove.mutateAsync({ id: entry.id, version: entry.version });
            router.replace("/transactions");
          }, "Transaction deleted")
        }
      />
      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        amount={amount}
        onReject={(reason) => handle(() => reject.mutateAsync({ id: entry.id, version: entry.version, reason }), "Transaction rejected")}
      />
    </>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  amount,
  onReject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: string;
  onReject: (reason: string) => Promise<void>;
}) {
  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange} title={`Reject ${amount}?`} description="The submitter sees your reason and can fix and resubmit.">
      <RejectForm onReject={onReject} onDone={() => onOpenChange(false)} />
    </ResponsiveDialog>
  );
}

function RejectForm({ onReject, onDone }: { onReject: (reason: string) => Promise<void>; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="contents"
      onSubmit={async (e) => {
        e.preventDefault();
        if (reason.trim().length < 3) {
          setError("Tell the submitter why (at least 3 characters)");
          return;
        }
        setPending(true);
        await onReject(reason.trim());
        setPending(false);
        onDone();
      }}
    >
      <ResponsiveDialogBody>
        <Field data-invalid={!!error}>
          <FieldLabel htmlFor="reject-reason">Reason</FieldLabel>
          <Textarea
            id="reject-reason"
            rows={3}
            autoFocus
            value={reason}
            maxLength={500}
            aria-invalid={!!error}
            placeholder="e.g. Please attach the invoice"
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
          />
          <FieldDescription>{reason.length}/500</FieldDescription>
          <FieldError>{error}</FieldError>
        </Field>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="secondary" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={pending}>
          {pending && <Spinner />}
          Reject
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}
