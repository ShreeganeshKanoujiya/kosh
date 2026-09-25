"use client";

import { KeyRound, LogOut, MoreHorizontal, Pencil, Trash2, UserCheck, UserX } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserMutations } from "@/hooks/use-users";
import { errorMessage } from "@/lib/api-client";
import type { UserDTO } from "@/types/dto";
import { ResetPasswordDialog } from "./reset-password-dialog";

type Confirm = "disable" | "enable" | "revoke" | "delete" | null;

export function UserActions({ user, onEdit }: { user: UserDTO; onEdit: (user: UserDTO) => void }) {
  const me = useSession();
  const router = useRouter();
  const qc = useQueryClient();
  const { update, remove, revokeSessions } = useUserMutations();
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const isSelf = user.id === me.user.id;
  const ownerLocked = user.isOwner && !me.isOwner;
  const canUpdate = me.can("users.update") && !ownerLocked;
  const canDelete = me.can("users.delete") && !isSelf && !user.isOwner;
  const canToggleStatus = canUpdate && !isSelf && !user.isOwner;

  if (!canUpdate && !canDelete) return null;

  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for ${user.fullName}`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {canUpdate && (
            <DropdownMenuItem onSelect={() => onEdit(user)}>
              <Pencil />
              Edit details & role
            </DropdownMenuItem>
          )}
          {canUpdate && !isSelf && (
            <DropdownMenuItem onSelect={() => setResetOpen(true)}>
              <KeyRound />
              Reset password
            </DropdownMenuItem>
          )}
          {canUpdate && (
            <DropdownMenuItem onSelect={() => setConfirm("revoke")}>
              <LogOut />
              Sign out all sessions
            </DropdownMenuItem>
          )}
          {canToggleStatus && (
            <DropdownMenuItem onSelect={() => setConfirm(user.status === "active" ? "disable" : "enable")}>
              {user.status === "active" ? <UserX /> : <UserCheck />}
              {user.status === "active" ? "Disable user" : "Enable user"}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirm("delete")}>
                <Trash2 />
                Delete user
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ResetPasswordDialog user={user} open={resetOpen} onOpenChange={setResetOpen} />

      <ConfirmDialog
        open={confirm === "disable"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Disable ${user.fullName}?`}
        description="They'll be signed out immediately and won't be able to log in until re-enabled. Their entries stay intact."
        confirmLabel="Disable user"
        destructive
        onConfirm={() => run(() => update.mutateAsync({ id: user.id, input: { status: "disabled" } }), "User disabled ✓")}
      />
      <ConfirmDialog
        open={confirm === "enable"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Enable ${user.fullName}?`}
        description="They'll be able to log in again with their existing password."
        confirmLabel="Enable user"
        onConfirm={() => run(() => update.mutateAsync({ id: user.id, input: { status: "active" } }), "User enabled ✓")}
      />
      <ConfirmDialog
        open={confirm === "revoke"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Sign out all sessions?"
        description={
          isSelf
            ? "You'll be signed out on every device, including this one."
            : `${user.fullName} will be signed out on every device and must log in again.`
        }
        confirmLabel="Sign out everywhere"
        destructive
        onConfirm={() =>
          run(async () => {
            await revokeSessions.mutateAsync(user.id);
            if (isSelf) {
              qc.clear();
              router.replace("/login?reason=logout");
              router.refresh();
            }
          }, "Sessions revoked ✓")
        }
      />
      <ConfirmDialog
        open={confirm === "delete"}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={`Delete ${user.fullName}?`}
        description={
          <>
            <p>They&apos;ll lose access immediately. Their past entries and the audit trail are kept.</p>
            <p className="mt-2">
              The username <span className="font-mono font-medium text-foreground">@{user.username}</span> stays reserved and can&apos;t be reused.
            </p>
          </>
        }
        confirmLabel="Delete user"
        destructive
        onConfirm={() => run(() => remove.mutateAsync(user.id), "User deleted ✓")}
      />
    </>
  );
}
