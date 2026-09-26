import { AlertCircle, Paperclip } from "lucide-react";
import { Card } from "@/components/ui/card";
import { auditLabel } from "@/config/audit";
import { ENTRY_TYPE_LABELS, PAYMENT_METHOD_LABELS, SOURCE_LABELS } from "@/config/entries";
import { formatDateTime } from "@/lib/format";
import type { AuditLogDTO, EntryDTO } from "@/types/dto";
import { EntryActions } from "./entry-actions";
import { EntryStatusBadge } from "./entry-status-badge";
import { Money } from "./money";

function longDate(ymd: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${ymd}T00:00:00Z`),
  );
}

function time12(hm: string | null) {
  if (!hm) return null;
  const [h, m] = hm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className={mono ? "text-right font-mono text-sm break-all" : "text-right text-sm font-medium"}>{value}</dd>
    </div>
  );
}

/** Financial detail view — hero amount, grouped facts, timeline and the allowed actions. */
export function EntryDetail({ entry, history = [] }: { entry: EntryDTO; history?: AuditLogDTO[] }) {
  const title = entry.merchantName ?? entry.description ?? entry.category?.name ?? ENTRY_TYPE_LABELS[entry.type];

  // Prefer the audit trail (it includes edits and re-submissions); fall back to the status fields.
  const fromAudit = [...history].reverse().map((h) => {
    const values = (h.newValues ?? {}) as { autoApproved?: boolean; reason?: string };
    const label =
      h.action === "transaction.approved" && values.autoApproved
        ? "Recorded (approval not required)"
        : h.action === "transaction.rejected" && values.reason
          ? `Rejected — “${values.reason}”`
          : auditLabel(h.action);
    return { label, by: h.user?.fullName ?? "", at: h.createdAt };
  });
  const fromFields = [
    { label: "Created", by: entry.createdBy.fullName, at: entry.createdAt },
    entry.submittedAt && { label: "Submitted", by: entry.createdBy.fullName, at: entry.submittedAt },
    entry.verifiedAt && entry.verifiedBy && { label: "Verified", by: entry.verifiedBy.fullName, at: entry.verifiedAt },
    entry.approvedAt && {
      label: entry.autoApproved ? "Recorded (approval not required)" : "Approved",
      by: entry.approvedBy?.fullName ?? "",
      at: entry.approvedAt,
    },
    entry.rejectedAt && entry.rejectedBy && { label: "Rejected", by: entry.rejectedBy.fullName, at: entry.rejectedAt },
  ].filter(Boolean) as { label: string; by: string; at: string }[];
  const timeline = fromAudit.length ? fromAudit : fromFields;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
      <div className="space-y-4">
        <Card className="items-center gap-3 px-6 py-8 text-center">
          <EntryStatusBadge status={entry.status} />
          <Money amount={entry.amount} currency={entry.currency} type={entry.type} className="text-[2.75rem] leading-none font-semibold tracking-tight" />
          <div>
            <p className="text-lg font-semibold">{title}</p>
            {entry.category && <p className="text-caption">{entry.category.name}</p>}
          </div>
          <p className="text-caption">
            {longDate(entry.entryDate)}
            {entry.entryTime && ` · ${time12(entry.entryTime)}`}
          </p>
        </Card>

        {entry.status === "rejected" && entry.rejectionReason && (
          <div role="status" className="flex gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            <div>
              <p className="font-medium">Rejected by {entry.rejectedBy?.fullName}</p>
              <p className="text-muted-foreground">{entry.rejectionReason}</p>
            </div>
          </div>
        )}

        <Card className="gap-0 px-5 py-2">
          <dl className="divide-y">
            <Row label="Entry number" value={entry.entryNumber} mono />
            <Row label="Type" value={ENTRY_TYPE_LABELS[entry.type]} />
            <Row label="Payment" value={PAYMENT_METHOD_LABELS[entry.paymentMethod]} />
            <Row label="UPI ID" value={entry.upiId} mono />
            <Row label="Transaction ID" value={entry.transactionId} mono />
            <Row label="Reference no." value={entry.referenceNumber} mono />
            <Row label="Merchant" value={entry.merchantName} />
            <Row label="Description" value={entry.merchantName ? entry.description : null} />
            <Row label="Cash account" value={entry.cashAccount.name} />
            <Row label="Source" value={SOURCE_LABELS[entry.source]} />
          </dl>
        </Card>

        <Card className="flex-row items-center gap-3 px-5 py-4">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Paperclip className="size-4" aria-hidden />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium">Receipt</p>
            <p className="text-caption">
              {entry.attachmentCount ? `${entry.attachmentCount} attached` : "No receipt attached"}
            </p>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="gap-4 p-5">
          <p className="text-card-title">Activity</p>
          <ol className="relative space-y-4 border-l pl-5">
            {timeline.map((t, i) => (
              <li key={`${t.label}-${i}`} className="relative">
                <span className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full border-2 border-card bg-primary" aria-hidden />
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground">
                  {t.by && `${t.by} · `}
                  {formatDateTime(t.at)}
                </p>
              </li>
            ))}
          </ol>
        </Card>
        {entry.allowedActions.length > 0 && (
          <Card className="sticky bottom-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+0.75rem)] z-20 gap-3 p-4 shadow-lg md:static md:shadow-none lg:p-5">
            <p className="hidden text-card-title lg:block">Actions</p>
            <EntryActions entry={entry} />
          </Card>
        )}
      </div>
    </div>
  );
}
