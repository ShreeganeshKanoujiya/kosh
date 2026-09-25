"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Lock, MoreHorizontal, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogFooter } from "@/components/common/responsive-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { FormAlert } from "@/components/forms/form-alert";
import { applyServerErrors } from "@/components/forms/form-utils";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { PERMISSION_GROUP_LABELS, type PermissionKey } from "@/config/permissions";
import { api, errorMessage } from "@/lib/api-client";
import type { PermissionDTO, RoleDTO } from "@/types/dto";
import { createRoleSchema } from "@/validators/role.schema";

const rolesKey = ["roles", "list"] as const;

function usePermissionCatalog() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async ({ signal }) => (await api<PermissionDTO[]>("/api/permissions", { signal })).data,
    staleTime: Infinity,
  });
}

export function RolesView({ initialRoles }: { initialRoles: RoleDTO[] }) {
  const me = useSession();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<RoleDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<RoleDTO | null>(null);

  const { data: roles, isPending } = useQuery({
    queryKey: rolesKey,
    queryFn: async ({ signal }) => (await api<RoleDTO[]>("/api/roles", { signal })).data,
    initialData: initialRoles,
  });
  const { data: catalog } = usePermissionCatalog();
  const remove = useMutation({
    mutationFn: (id: string) => api(`/api/roles/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });

  const total = catalog?.length ?? 0;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-caption max-w-lg">
          System roles cover most teams. Create a custom role when you need a different mix of permissions.
        </p>
        {me.can("roles.create") && (
          <Button onClick={() => setCreating(true)} className="max-sm:w-full">
            <Plus />
            New role
          </Button>
        )}
      </div>

      {isPending ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {roles.map((role) => (
            <li key={role.id} className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {role.name}
                    {role.isSystemRole ? (
                      <StatusBadge tone="neutral">
                        <Lock className="size-3" aria-hidden />
                        System
                      </StatusBadge>
                    ) : (
                      <StatusBadge tone="primary">Custom</StatusBadge>
                    )}
                  </p>
                  {role.description && <p className="text-caption mt-0.5">{role.description}</p>}
                </div>
                {!role.isSystemRole && (me.can("roles.update") || me.can("roles.delete")) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label={`Actions for ${role.name}`}>
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {me.can("roles.update") && (
                        <DropdownMenuItem onSelect={() => setEditing(role)}>
                          <Pencil />
                          Edit role
                        </DropdownMenuItem>
                      )}
                      {me.can("roles.delete") && (
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(role)}>
                          <Trash2 />
                          Delete role
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" aria-hidden />
                  {role.permissions.length}
                  {total ? ` of ${total}` : ""} permissions
                </span>
                <span>
                  {role.userCount} user{role.userCount === 1 ? "" : "s"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RoleFormDialog open={creating} onOpenChange={setCreating} catalog={catalog ?? []} />
      <RoleFormDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} role={editing} catalog={catalog ?? []} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="This can't be undone. Roles that are still assigned to users can't be deleted."
        confirmLabel="Delete role"
        destructive
        onConfirm={async () => {
          try {
            await remove.mutateAsync(deleting!.id);
            toast.success("Role deleted ✓");
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </>
  );
}

function RoleFormDialog({
  open,
  onOpenChange,
  role,
  catalog,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: RoleDTO | null;
  catalog: PermissionDTO[];
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={role ? `Edit ${role.name}` : "New role"}
      description="You can only grant permissions you have yourself."
      className="sm:max-w-2xl"
    >
      <RoleForm role={role ?? null} catalog={catalog} onDone={() => onOpenChange(false)} />
    </ResponsiveDialog>
  );
}

function RoleForm({ role, catalog, onDone }: { role: RoleDTO | null; catalog: PermissionDTO[]; onDone: () => void }) {
  const me = useSession();
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: role?.name ?? "", description: role?.description ?? "", permissions: role?.permissions ?? ([] as string[]) },
  });
  const { register, handleSubmit, control, setError, formState } = form;

  const groups = useMemo(() => {
    const map = new Map<string, PermissionDTO[]>();
    for (const p of catalog) map.set(p.group, [...(map.get(p.group) ?? []), p]);
    return [...map.entries()];
  }, [catalog]);

  const save = useMutation({
    mutationFn: (body: unknown) =>
      role ? api<RoleDTO>(`/api/roles/${role.id}`, { method: "PATCH", body }) : api<RoleDTO>("/api/roles", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await save.mutateAsync(values);
      toast.success(role ? "Role updated ✓" : "Role created ✓");
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError, ["name", "description", "permissions"])) setFormError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="contents">
      <ResponsiveDialogBody className="space-y-6">
        <FormAlert message={formError} />
        <FieldGroup>
          <Field data-invalid={!!formState.errors.name}>
            <FieldLabel htmlFor="role-name">Name</FieldLabel>
            <Input id="role-name" placeholder="e.g. Branch supervisor" aria-invalid={!!formState.errors.name} {...register("name")} />
            <FieldError errors={[formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="role-description">Description</FieldLabel>
            <Textarea id="role-description" rows={2} placeholder="What is this role for?" {...register("description")} />
          </Field>
        </FieldGroup>

        <Controller
          control={control}
          name="permissions"
          render={({ field, fieldState }) => {
            const selected = new Set(field.value);
            const toggle = (key: string, on: boolean) => {
              const next = new Set(selected);
              if (on) next.add(key);
              else next.delete(key);
              field.onChange([...next]);
            };
            return (
              <fieldset className="space-y-4" aria-describedby={fieldState.error ? "permissions-error" : undefined}>
                <legend className="mb-3 text-sm font-medium">Permissions</legend>
                {groups.map(([group, perms]) => (
                  <div key={group} className="rounded-xl border p-4">
                    <p className="text-meta mb-3 font-medium tracking-wide uppercase">{PERMISSION_GROUP_LABELS[group] ?? group}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {perms.map((p) => {
                        const allowed = me.isOwner || me.can(p.key as PermissionKey);
                        return (
                          <label key={p.key} className="flex items-start gap-3 text-sm has-disabled:opacity-50">
                            <Checkbox
                              checked={selected.has(p.key)}
                              disabled={!allowed}
                              onCheckedChange={(v) => toggle(p.key, v === true)}
                              className="mt-0.5"
                            />
                            <span>
                              <span className="block">{p.description}</span>
                              <span className="block font-mono text-[0.6875rem] text-muted-foreground">{p.key}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <FieldError id="permissions-error" errors={[fieldState.error]} />
              </fieldset>
            );
          }}
        />
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="secondary" onClick={onDone} disabled={formState.isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {role ? "Save role" : "Create role"}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}
