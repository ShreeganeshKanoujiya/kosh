import { z } from "zod";

export const USERNAME_REGEX = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(USERNAME_REGEX, "Use letters, numbers, dot, underscore or hyphen (start with a letter or number)");

export const companyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,12}$/, "Enter a valid company code");

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(120, "Name must be at most 120 characters");

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email("Enter a valid email address"));

/** Optional email that accepts "" from forms and turns it into null. */
export const optionalEmailSchema = z
  .union([z.literal(""), emailSchema])
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const idSchema = z.uuid("Invalid id");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const searchSchema = z.string().trim().max(100).optional();
