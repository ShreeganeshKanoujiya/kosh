import { z } from "zod";
import { companyCodeSchema, emailSchema, fullNameSchema, usernameSchema } from "./common";
import { passwordSchema, refinePasswordNotUsername } from "./password";

export const registerSchema = z
  .object({
    companyName: z.string().trim().min(2, "Company name must be at least 2 characters").max(120),
    ownerFullName: fullNameSchema,
    ownerEmail: emailSchema,
    username: usernameSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    refinePasswordNotUsername(data, ctx);
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
    }
  });
export type RegisterInput = z.input<typeof registerSchema>;

export const loginSchema = z.object({
  companyCode: companyCodeSchema,
  username: z.string().trim().toLowerCase().min(1, "Enter your username").max(64),
  // No strength rules on login — only bound the size.
  password: z.string().min(1, "Enter your password").max(256),
});
export type LoginInput = z.input<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  companyCode: companyCodeSchema,
  username: z.string().trim().toLowerCase().min(1, "Enter your username").max(64),
});
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(20).max(200),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password").max(256),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((d, ctx) => {
    if (d.newPassword !== d.confirmPassword) {
      ctx.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match" });
    }
    if (d.newPassword === d.currentPassword) {
      ctx.addIssue({ code: "custom", path: ["newPassword"], message: "Choose a password you haven't used here" });
    }
  });
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;

export const updateProfileSchema = z.object({
  fullName: fullNameSchema,
  email: z
    .union([z.literal(""), emailSchema])
    .nullable()
    .transform((v) => (v ? v : null)),
});
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
