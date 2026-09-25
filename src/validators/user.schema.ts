import { z } from "zod";
import {
  emailSchema,
  fullNameSchema,
  idSchema,
  optionalEmailSchema,
  paginationSchema,
  searchSchema,
  usernameSchema,
} from "./common";
import { passwordSchema, refinePasswordNotUsername } from "./password";

export const userStatusSchema = z.enum(["active", "disabled"]);

export const createUserSchema = z
  .object({
    fullName: fullNameSchema,
    username: usernameSchema,
    email: optionalEmailSchema,
    password: passwordSchema,
    roleId: idSchema,
    status: userStatusSchema.default("active"),
  })
  .superRefine(refinePasswordNotUsername);
export type CreateUserInput = z.input<typeof createUserSchema>;

export const updateUserSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    // undefined = leave unchanged, "" / null = clear
    email: z
      .union([z.literal(""), emailSchema])
      .nullable()
      .optional()
      .transform((v) => (v === undefined ? undefined : v ? v : null)),
    roleId: idSchema.optional(),
    status: userStatusSchema.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), { message: "Nothing to update" });
export type UpdateUserInput = z.input<typeof updateUserSchema>;

export const adminResetPasswordSchema = z.object({
  newPassword: passwordSchema,
});
export type AdminResetPasswordInput = z.input<typeof adminResetPasswordSchema>;

export const listUsersQuerySchema = paginationSchema.extend({
  search: searchSchema,
  status: userStatusSchema.optional(),
  roleId: idSchema.optional(),
});
export type ListUsersQuery = z.output<typeof listUsersQuerySchema>;
