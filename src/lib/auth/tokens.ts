import { createHash, randomBytes, randomInt } from "node:crypto";

/** 256-bit opaque token, URL-safe. Used for refresh, password-reset and invitation tokens. */
export function generateOpaqueToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * High-entropy tokens only need a fast hash (no salt / KDF): brute-forcing a
 * 256-bit random value is infeasible. Never use this for passwords.
 */
export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// No 0/O, 1/I/L — codes are read aloud and typed on phones.
const COMPANY_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const COMPANY_CODE_LENGTH = 6;

/** Random, server-generated company code (31^6 ≈ 887M combinations). */
export function generateCompanyCode(length = COMPANY_CODE_LENGTH): string {
  let code = "";
  for (let i = 0; i < length; i++) code += COMPANY_CODE_ALPHABET[randomInt(COMPANY_CODE_ALPHABET.length)];
  return code;
}

export function normalizeCompanyCode(value: string): string {
  return value.trim().toUpperCase();
}

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}
