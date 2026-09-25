import { Ban, CheckCircle2, Clock, FileEdit, Send, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { STATUS_LABELS, STATUS_TONES, type EntryStatusValue } from "@/config/entries";

const ICONS: Record<EntryStatusValue, typeof Clock> = {
  draft: FileEdit,
  submitted: Send,
  pending_approval: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  cancelled: Ban,
};

/** Status always pairs an icon with its label — never colour alone. */
export function EntryStatusBadge({ status, className }: { status: EntryStatusValue; className?: string }) {
  const Icon = ICONS[status];
  return (
    <StatusBadge tone={STATUS_TONES[status]} className={className}>
      <Icon className="size-3" aria-hidden />
      {STATUS_LABELS[status]}
    </StatusBadge>
  );
}
