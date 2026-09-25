import "server-only";
import { STATUS_LABELS, type EntryAction, type EntryStatusValue, type EntryTypeValue } from "@/config/entries";
import { AppError, Errors } from "@/lib/api/errors";
import type { AuthContext } from "@/types/auth";

/**
 * The single source of truth for "who may do what to an entry, and when".
 * The UI renders whatever this returns (EntryDTO.allowedActions); the API enforces it.
 *
 *   draft ──submit──▶ submitted ──verify──▶ pending_approval ──approve──▶ approved
 *     ▲                   │ └────────────approve──────────────────────▲
 *     │                   └──reject──▶ rejected ──edit / submit──────┘ (resubmit)
 *   any open state ──cancel──▶ cancelled        draft/rejected/cancelled ──delete──▶ (soft-deleted)
 *
 * When the company doesn't require approval, submit approves immediately.
 */
export const STATUS_ALLOWS: Record<EntryAction, readonly EntryStatusValue[]> = {
  edit: ["draft", "submitted", "pending_approval", "rejected"],
  submit: ["draft", "rejected"],
  verify: ["submitted"],
  approve: ["submitted", "pending_approval"],
  reject: ["submitted", "pending_approval"],
  cancel: ["draft", "submitted", "pending_approval", "rejected"],
  delete: ["draft", "rejected", "cancelled"],
};

const VERBS: Record<EntryAction, string> = {
  edit: "edited",
  submit: "submitted",
  verify: "verified",
  approve: "approved",
  reject: "rejected",
  cancel: "cancelled",
  delete: "deleted",
};

export interface PolicySubject {
  status: EntryStatusValue;
  type: EntryTypeValue;
  createdById: string;
}

export function allowedEntryActions(auth: AuthContext, entry: PolicySubject): EntryAction[] {
  const can = (p: Parameters<AuthContext["permissions"]["has"]>[0]) => auth.permissions.has(p);
  const mine = entry.createdById === auth.userId;
  const isVerifier = can("transactions.verify");
  // Segregation of duties: nobody reviews their own entry — except the owner (single-person companies).
  const mayReview = !mine || auth.isOwner;
  const s = entry.status;
  const out: EntryAction[] = [];

  const creatorEdits = mine && can("transactions.update") && (s === "draft" || s === "rejected");
  const verifierEdits = isVerifier && STATUS_ALLOWS.edit.includes(s);
  if ((creatorEdits || verifierEdits) && (entry.type !== "adjustment" || isVerifier)) out.push("edit");

  if (STATUS_ALLOWS.submit.includes(s) && ((mine && (can("transactions.create") || can("transactions.update"))) || isVerifier)) {
    out.push("submit");
  }
  if (STATUS_ALLOWS.verify.includes(s) && isVerifier && mayReview) out.push("verify");
  if (STATUS_ALLOWS.approve.includes(s) && can("transactions.approve") && mayReview) out.push("approve");
  if (STATUS_ALLOWS.reject.includes(s) && can("transactions.reject") && mayReview) out.push("reject");
  if (STATUS_ALLOWS.cancel.includes(s) && (mine || isVerifier)) out.push("cancel");
  if (STATUS_ALLOWS.delete.includes(s) && (can("transactions.delete") || (mine && s === "draft"))) out.push("delete");
  return out;
}

/** Throw the right error for a disallowed action: 409 for a wrong state, 403 for a missing right. */
export function assertEntryAction(auth: AuthContext, entry: PolicySubject, action: EntryAction) {
  if (allowedEntryActions(auth, entry).includes(action)) return;
  if (!STATUS_ALLOWS[action].includes(entry.status)) {
    throw new AppError(
      "INVALID_STATUS",
      `This entry is ${STATUS_LABELS[entry.status].toLowerCase()} and can't be ${VERBS[action]}.`,
      409,
    );
  }
  const mine = entry.createdById === auth.userId;
  if (mine && (action === "approve" || action === "reject" || action === "verify") && !auth.isOwner) {
    throw Errors.forbidden(`You can't ${action} your own entry. Ask another reviewer.`);
  }
  throw Errors.forbidden();
}
