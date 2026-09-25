import "server-only";
import type { PermissionKey } from "@/config/permissions";
import { formatCurrency } from "@/lib/format";
import { logger } from "@/lib/logger";
import { money } from "@/lib/money";
import { notificationRepository, type NewNotification } from "@/repositories/notification.repository";
import type { EntryRow } from "@/repositories/entry.repository";
import type { AuthContext } from "@/types/auth";

export type NotificationType =
  | "transaction.submitted"
  | "transaction.verified"
  | "transaction.approved"
  | "transaction.rejected"
  | "user.created"
  | "export.completed";

export interface NotificationMessage {
  type: NotificationType;
  title: string;
  body?: string;
  entityType?: string;
  entityId?: string;
}

/**
 * Delivery channels. In-app is always on; email / push channels can be added
 * here later (e.g. an EmailChannel using lib/mail) without touching callers.
 */
interface NotificationChannel {
  name: string;
  deliver(companyId: string, userIds: string[], message: NotificationMessage): Promise<void>;
}

const inAppChannel: NotificationChannel = {
  name: "in_app",
  async deliver(companyId, userIds, message) {
    const rows: NewNotification[] = userIds.map((userId) => ({
      companyId,
      userId,
      type: message.type,
      title: message.title,
      body: message.body ?? null,
      entityType: message.entityType ?? null,
      entityId: message.entityId ?? null,
    }));
    await notificationRepository.createMany(rows);
  },
};

const channels: NotificationChannel[] = [inAppChannel];

/** Fire-and-log: a notification failure must never fail the business action that caused it. */
export async function notify(companyId: string, userIds: string[], message: NotificationMessage) {
  const recipients = [...new Set(userIds)];
  if (!recipients.length) return;
  for (const channel of channels) {
    try {
      await channel.deliver(companyId, recipients, message);
    } catch (error) {
      logger.error("Notification delivery failed", { channel: channel.name, type: message.type, error });
    }
  }
}

export async function notifyUsersWithPermission(
  auth: AuthContext,
  anyOf: PermissionKey[],
  message: NotificationMessage,
  options: { excludeUserIds?: string[] } = {},
) {
  try {
    const users = await notificationRepository.findUsersWithPermission(auth.companyId, anyOf);
    const exclude = new Set([auth.userId, ...(options.excludeUserIds ?? [])]);
    await notify(auth.companyId, users.map((u) => u.id).filter((id) => !exclude.has(id)), message);
  } catch (error) {
    logger.error("Failed to resolve notification recipients", { type: message.type, error });
  }
}

function describe(entry: EntryRow) {
  const amount = formatCurrency(money(entry.amount).replace("-", ""), entry.currency);
  const what = entry.merchantName ?? entry.description ?? entry.category?.name ?? "petty cash entry";
  return { amount, what };
}

export async function notifyEntryEvent(
  auth: AuthContext,
  entry: EntryRow,
  event: "submitted" | "auto_approved" | "verified" | "approved" | "rejected",
) {
  const { amount, what } = describe(entry);
  const base = { entityType: "transaction", entityId: entry.id };

  switch (event) {
    case "submitted":
      return notifyUsersWithPermission(
        auth,
        ["transactions.approve", "transactions.verify"],
        {
          ...base,
          type: "transaction.submitted",
          title: `${amount} transaction requires approval`,
          body: `${entry.entryNumber} · ${what} · by ${entry.createdBy.fullName}`,
        },
        { excludeUserIds: [entry.createdById] },
      );
    case "verified":
      return notifyUsersWithPermission(
        auth,
        ["transactions.approve"],
        {
          ...base,
          type: "transaction.verified",
          title: `${amount} transaction verified — awaiting approval`,
          body: `${entry.entryNumber} · ${what}`,
        },
        { excludeUserIds: [entry.createdById] },
      );
    case "approved":
      if (entry.createdById === auth.userId) return;
      return notify(auth.companyId, [entry.createdById], {
        ...base,
        type: "transaction.approved",
        title: `Your ${amount} transaction was approved`,
        body: `${entry.entryNumber} · ${what}`,
      });
    case "rejected":
      if (entry.createdById === auth.userId) return;
      return notify(auth.companyId, [entry.createdById], {
        ...base,
        type: "transaction.rejected",
        title: `Your ${amount} transaction was rejected`,
        body: entry.rejectionReason ? `Reason: ${entry.rejectionReason}` : entry.entryNumber,
      });
    case "auto_approved":
      return;
  }
}

// ─── Activity centre ───────────────────────────────────────────────────────

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
}

export async function listMyNotifications(auth: AuthContext) {
  const [items, unread] = await Promise.all([
    notificationRepository.listForUser(auth.userId, 30),
    notificationRepository.countUnread(auth.userId),
  ]);
  return {
    unread,
    items: items.map<NotificationDTO>((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      entityType: n.entityType,
      entityId: n.entityId,
      read: n.readAt !== null,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

/** Scoped by userId, so nobody can mark someone else's notifications. */
export async function markNotificationsRead(auth: AuthContext, ids: string[] | "all") {
  const { count } = await notificationRepository.markRead(auth.userId, ids);
  return count;
}
