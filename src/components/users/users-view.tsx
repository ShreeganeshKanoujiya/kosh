"use client";

import { ChevronLeft, ChevronRight, Crown, Plus, Search, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { PageHeader } from "@/components/layout/page-header";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useRoleOptions, useUsers, type UserFilters } from "@/hooks/use-users";
import { formatDate } from "@/lib/format";
import { TimeAgo } from "@/components/common/time-ago";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/types/api";
import type { UserDTO } from "@/types/dto";
import { UserActions } from "./user-actions";
import { UserFormDialog } from "./user-form-dialog";

const PAGE_SIZE = 20;
const ALL = "all";

function StatusPill({ status }: { status: UserDTO["status"] }) {
  return status === "active" ? (
    <StatusBadge tone="success" dot>
      Active
    </StatusBadge>
  ) : (
    <StatusBadge tone="neutral" dot>
      Disabled
    </StatusBadge>
  );
}

function RoleLabel({ user, className }: { user: UserDTO; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", className)}>
      {user.isOwner && <Crown className="size-3.5 text-warning" aria-label="Owner" />}
      {user.role.name}
    </span>
  );
}

export function UsersView({ initialData }: { initialData: Paginated<UserDTO> }) {
  const me = useSession();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [roleId, setRoleId] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<UserDTO | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const filters: UserFilters = {
    page,
    pageSize: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status === ALL ? undefined : (status as UserFilters["status"]),
    roleId: roleId === ALL ? undefined : roleId,
  };
  const isInitial = page === 1 && !filters.search && !filters.status && !filters.roleId;
  const { data, isFetching, isPending } = useUsers(filters, isInitial ? initialData : undefined);
  const { data: roles } = useRoleOptions();

  const hasFilters = Boolean(filters.search || filters.status || filters.roleId);
  const canCreate = me.can("users.create");

  const resetPage = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setPage(1);
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="People who can access your company's petty cash."
        actions={
          canCreate && (
            <Button onClick={() => setCreateOpen(true)} className="max-md:w-full">
              <UserPlus />
              Add user
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            type="search"
            value={search}
            onChange={(e) => resetPage(setSearch)(e.target.value)}
            placeholder="Search name, username or email"
            aria-label="Search users"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Select value={status} onValueChange={resetPage(setStatus)}>
            <SelectTrigger className="w-full sm:w-36" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleId} onValueChange={resetPage(setRoleId)}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Filter by role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All roles</SelectItem>
              {(roles ?? []).map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isPending ? (
        <UsersSkeleton />
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={hasFilters ? "No users match your filters" : "No users yet"}
          description={hasFilters ? "Try a different search or clear the filters." : "Add your team so they can record petty cash."}
          action={
            hasFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch("");
                  setStatus(ALL);
                  setRoleId(ALL);
                  setPage(1);
                }}
              >
                Clear filters
              </Button>
            ) : (
              canCreate && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus />
                  Add user
                </Button>
              )
            )
          }
        />
      ) : (
        <div className={cn("transition-opacity", isFetching && "opacity-70")} aria-busy={isFetching}>
          {/* Tablet / desktop: table */}
          <Card className="hidden overflow-hidden p-0 md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-5">Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Last login</TableHead>
                  <TableHead className="hidden xl:table-cell">Created</TableHead>
                  <TableHead className="w-14 pr-5">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={u.fullName} seed={u.id} />
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {u.fullName}
                            {u.id === me.user.id && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}
                          </p>
                          {u.email && <p className="truncate text-xs text-muted-foreground">{u.email}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-[0.8125rem]">{u.username}</TableCell>
                    <TableCell>
                      <RoleLabel user={u} />
                    </TableCell>
                    <TableCell>
                      <StatusPill status={u.status} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {u.lastLoginAt ? <TimeAgo date={u.lastLoginAt} /> : "Never"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">{formatDate(u.createdAt)}</TableCell>
                    <TableCell className="pr-5 text-right">
                      <UserActions user={u} onEdit={setEditing} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile: cards */}
          <ul className="space-y-2 md:hidden">
            {data.items.map((u) => (
              <li key={u.id}>
                <Card className="flex-row items-center gap-3 px-4 py-3">
                  <UserAvatar name={u.fullName} seed={u.id} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{u.fullName}</p>
                      {u.status === "disabled" && <StatusPill status={u.status} />}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      @{u.username} · <RoleLabel user={u} className="text-xs" />
                    </p>
                  </div>
                  <UserActions user={u} onEdit={setEditing} />
                </Card>
              </li>
            ))}
          </ul>

          {data.totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
              <p className="text-caption">
                {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)} of {data.total}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight />
                </Button>
              </div>
            </nav>
          )}
        </div>
      )}

      <UserFormDialog open={createOpen} onOpenChange={setCreateOpen} currentUserId={me.user.id} />
      <UserFormDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        user={editing}
        currentUserId={me.user.id}
      />
    </>
  );
}

function UsersSkeleton() {
  return (
    <div className="space-y-2" aria-label="Loading users" role="status">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}
