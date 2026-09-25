import { z } from "zod";
import { isPermissionKey, type PermissionKey } from "@/config/permissions";

const permissionKeysSchema = z
  .array(z.string())
  .max(100)
  .transform((keys, ctx) => {
    const unique = [...new Set(keys)];
    const invalid = unique.filter((k) => !isPermissionKey(k));
    if (invalid.length) {
      ctx.addIssue({ code: "custom", message: `Unknown permissions: ${invalid.join(", ")}` });
      return z.NEVER;
    }
    return unique as PermissionKey[];
  });

export const createRoleSchema = z.object({
  name: z.string().trim().min(2, "Role name must be at least 2 characters").max(50),
  description: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  permissions: permissionKeysSchema.refine((keys) => keys.length > 0, "Select at least one permission"),
});
export type CreateRoleInput = z.input<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(50).optional(),
  description: z
    .string()
    .trim()
    .max(255)
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? undefined : v ? v : null)),
  permissions: permissionKeysSchema.refine((keys) => keys.length > 0, "Select at least one permission").optional(),
});
export type UpdateRoleInput = z.input<typeof updateRoleSchema>;
