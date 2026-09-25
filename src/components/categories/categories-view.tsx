"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Pencil, Plus, Power, Tags, Trash2 } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { ResponsiveDialog, ResponsiveDialogBody, ResponsiveDialogFooter } from "@/components/common/responsive-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { FormAlert } from "@/components/forms/form-alert";
import { applyServerErrors } from "@/components/forms/form-utils";
import { PageHeader } from "@/components/layout/page-header";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { useCategories, useReferenceMutations } from "@/hooks/use-reference-data";
import { errorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { CategoryDTO } from "@/types/dto";
import { categorySchema } from "@/validators/company.schema";

export function CategoriesView({ initialData }: { initialData: CategoryDTO[] }) {
  const me = useSession();
  const { data = initialData } = useCategories();
  const { updateCategory, deleteCategory } = useReferenceMutations();
  const [editing, setEditing] = useState<CategoryDTO | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<CategoryDTO | null>(null);

  const toggle = async (c: CategoryDTO) => {
    try {
      await updateCategory.mutateAsync({ id: c.id, input: { isActive: !c.isActive } });
      toast.success(c.isActive ? "Category deactivated" : "Category activated ✓");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group expenses so reports make sense. Inactive categories stay on past entries."
        actions={
          me.can("categories.create") && (
            <Button onClick={() => setCreating(true)} className="max-md:w-full">
              <Plus />
              New category
            </Button>
          )
        }
      />

      {data.length === 0 ? (
        <EmptyState icon={Tags} title="No categories yet" description="Create categories like Travel or Office Supplies." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((c) => (
            <li key={c.id} className={cn("flex items-start gap-3 rounded-2xl border bg-card p-4", !c.isActive && "opacity-70")}>
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Tags className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  <span className="truncate">{c.name}</span>
                  {!c.isActive && <StatusBadge>Inactive</StatusBadge>}
                </p>
                {c.description && <p className="text-caption line-clamp-2">{c.description}</p>}
                <p className="text-meta mt-1">
                  {c.entryCount} entr{c.entryCount === 1 ? "y" : "ies"}
                </p>
              </div>
              {(me.can("categories.update") || me.can("categories.delete")) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Actions for ${c.name}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {me.can("categories.update") && (
                      <>
                        <DropdownMenuItem onSelect={() => setEditing(c)}>
                          <Pencil />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => toggle(c)}>
                          <Power />
                          {c.isActive ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                      </>
                    )}
                    {me.can("categories.delete") && c.entryCount === 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(c)}>
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ul>
      )}

      <ResponsiveDialog open={creating} onOpenChange={setCreating} title="New category">
        <CategoryForm onDone={() => setCreating(false)} />
      </ResponsiveDialog>
      <ResponsiveDialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)} title={`Edit ${editing?.name ?? ""}`}>
        {editing && <CategoryForm category={editing} onDone={() => setEditing(null)} />}
      </ResponsiveDialog>
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name}”?`}
        description="This category has never been used, so it can be removed completely."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          try {
            await deleteCategory.mutateAsync(deleting!.id);
            toast.success("Category deleted");
          } catch (error) {
            toast.error(errorMessage(error));
          }
        }}
      />
    </>
  );
}

function CategoryForm({ category, onDone }: { category?: CategoryDTO; onDone: () => void }) {
  const { createCategory, updateCategory } = useReferenceMutations();
  const [formError, setFormError] = useState<string | null>(null);
  const form = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? "", description: category?.description ?? "", isActive: category?.isActive ?? true },
  });
  const { register, handleSubmit, control, setError, formState } = form;

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      if (category) await updateCategory.mutateAsync({ id: category.id, input: values });
      else await createCategory.mutateAsync(values);
      toast.success(category ? "Category updated ✓" : "Category created ✓");
      onDone();
    } catch (error) {
      if (!applyServerErrors(error, setError, ["name", "description"])) setFormError(errorMessage(error));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="contents">
      <ResponsiveDialogBody className="space-y-5">
        <FormAlert message={formError} />
        <FieldGroup>
          <Field data-invalid={!!formState.errors.name}>
            <FieldLabel htmlFor="cat-name">Name</FieldLabel>
            <Input id="cat-name" autoFocus placeholder="e.g. Travel" aria-invalid={!!formState.errors.name} {...register("name")} />
            <FieldError errors={[formState.errors.name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="cat-desc">Description</FieldLabel>
            <Input id="cat-desc" placeholder="What belongs here?" {...register("description")} />
          </Field>
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <Field orientation="horizontal" className="justify-between rounded-xl border p-3">
                <div>
                  <FieldLabel htmlFor="cat-active">Active</FieldLabel>
                  <FieldDescription>Only active categories can be chosen for new entries.</FieldDescription>
                </div>
                <Switch id="cat-active" checked={field.value} onCheckedChange={field.onChange} />
              </Field>
            )}
          />
        </FieldGroup>
      </ResponsiveDialogBody>
      <ResponsiveDialogFooter>
        <Button type="button" variant="secondary" onClick={onDone} disabled={formState.isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting && <Spinner />}
          {category ? "Save" : "Create category"}
        </Button>
      </ResponsiveDialogFooter>
    </form>
  );
}
