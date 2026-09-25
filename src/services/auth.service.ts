import "server-only";
import {
  LOGIN_LOCKOUT,
  PASSWORD_RESET_TTL_MINUTES,
  RATE_LIMITS,
} from "@/config/auth";
import { AppError, Errors } from "@/lib/api/errors";
import { hashPassword, needsRehash, verifyPassword } from "@/lib/auth/password";
import {
  generateCompanyCode,
  generateOpaqueToken,
  normalizeCompanyCode,
  normalizeUsername,
  sha256Hex,
} from "@/lib/auth/tokens";
import { prisma } from "@/lib/db/prisma";
import { sendMail } from "@/lib/mail";
import { logger } from "@/lib/logger";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import type { RequestMeta } from "@/lib/security/request-meta";
import { Prisma } from "@/generated/prisma/client";
import { companyRepository } from "@/repositories/company.repository";
import { loginAttemptRepository } from "@/repositories/login-attempt.repository";
import { passwordResetRepository } from "@/repositories/password-reset.repository";
import { sessionRepository } from "@/repositories/session.repository";
import { userRepository } from "@/repositories/user.repository";
import type { AuthContext } from "@/types/auth";
import type { MeDTO, RegisterResultDTO } from "@/types/dto";
import type { z } from "zod";
import type {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "@/validators/auth.schema";
import { AUDIT_ACTIONS, recordAudit, recordAuditSafe } from "./audit.service";
import { getCompanyLocale } from "./company.service";
import { createSystemRoles, ensurePermissionCatalog } from "./permission-catalog.service";
import { startSession, type StartedSession } from "./session.service";

type Out<S extends z.ZodType> = z.output<S>;

const DEFAULT_CATEGORIES = [
  { name: "Office Supplies", description: "Stationery, printing and small office items" },
  { name: "Travel", description: "Local conveyance, fuel, parking and tolls" },
  { name: "Refreshments", description: "Tea, coffee, snacks and meals" },
  { name: "Postage & Courier", description: "Couriers, postage and delivery charges" },
  { name: "Repairs & Maintenance", description: "Minor repairs and upkeep" },
  { name: "Cleaning", description: "Cleaning supplies and services" },
  { name: "Utilities", description: "Electricity, water, internet top-ups" },
  { name: "Miscellaneous", description: "Anything that does not fit elsewhere" },
];

const INVALID_CREDENTIALS = () =>
  new AppError("INVALID_CREDENTIALS", "Invalid company code, username or password.", 401);

function isUniqueViolationOn(error: unknown, column: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    JSON.stringify(error.meta ?? {}).includes(column)
  );
}

// ─── Registration ───────────────────────────────────────────────────────────

export async function registerCompany(
  input: Out<typeof registerSchema>,
  meta: RequestMeta,
): Promise<{ result: RegisterResultDTO; session: StartedSession }> {
  await enforceRateLimit(
    `register:ip:${meta.ipAddress ?? "unknown"}`,
    RATE_LIMITS.registerPerIp,
    "Too many companies created from this network. Please try again later.",
  );
  await ensurePermissionCatalog();

  const passwordHash = await hashPassword(input.password);

  // A collision on a random 6-char code is rare; retry with a fresh code.
  for (let attempt = 1; attempt <= 5; attempt++) {
    const companyCode = generateCompanyCode();
    try {
      const { company, owner } = await prisma.$transaction(
        async (tx) => {
          const company = await companyRepository.create({ companyCode, name: input.companyName }, tx);
          const roleIds = await createSystemRoles(company.id, tx);

          const owner = await userRepository.create(
            {
              companyId: company.id,
              username: input.username,
              email: input.ownerEmail,
              fullName: input.ownerFullName,
              passwordHash,
              roleId: roleIds.owner,
              status: "active",
              createdById: null,
            },
            tx,
          );
          await companyRepository.setOwner(company.id, owner.id, tx);

          const cashAccount = await companyRepository.createCashAccount(company.id, { name: "Main Cash", currency: "INR" }, tx);
          await companyRepository.createSettings(company.id, { defaultCashAccountId: cashAccount.id }, tx);
          await companyRepository.createCategories(company.id, DEFAULT_CATEGORIES, tx);

          await recordAudit(
            {
              companyId: company.id,
              userId: owner.id,
              action: AUDIT_ACTIONS.companyCreated,
              entityType: "company",
              entityId: company.id,
              newValues: { companyName: company.name, companyCode: company.companyCode },
              meta,
            },
            tx,
          );
          await recordAudit(
            {
              companyId: company.id,
              userId: owner.id,
              action: AUDIT_ACTIONS.userCreated,
              entityType: "user",
              entityId: owner.id,
              newValues: { username: owner.username, fullName: owner.fullName, role: "owner" },
              meta,
            },
            tx,
          );
          return { company, owner };
        },
        { timeout: 20_000 },
      );

      const session = await startSession({ userId: owner.id, companyId: company.id, meta });
      await userRepository.update(company.id, owner.id, { lastLoginAt: new Date() });
      await loginAttemptRepository.record({
        companyId: company.id,
        userId: owner.id,
        companyCode: company.companyCode,
        username: owner.username,
        success: true,
        ...meta,
      });

      return {
        result: {
          company: { code: company.companyCode, name: company.name },
          user: { username: owner.username, fullName: owner.fullName },
        },
        session,
      };
    } catch (error) {
      if (isUniqueViolationOn(error, "company_code") && attempt < 5) continue;
      throw error;
    }
  }
  throw new AppError("CODE_GENERATION_FAILED", "Could not generate a company code. Please try again.", 503);
}

// ─── Login ──────────────────────────────────────────────────────────────────

export async function login(input: Out<typeof loginSchema>, meta: RequestMeta): Promise<StartedSession> {
  await enforceRateLimit(`login:ip:${meta.ipAddress ?? "unknown"}`, RATE_LIMITS.loginPerIp);

  const companyCode = normalizeCompanyCode(input.companyCode);
  const username = normalizeUsername(input.username);

  const windowStart = new Date(Date.now() - LOGIN_LOCKOUT.windowMinutes * 60_000);
  const recentFailures = await loginAttemptRepository.countRecentFailures(companyCode, username, windowStart);
  if (recentFailures >= LOGIN_LOCKOUT.maxFailures) {
    throw new AppError(
      "ACCOUNT_LOCKED",
      `Too many failed attempts. Please wait ${LOGIN_LOCKOUT.windowMinutes} minutes or reset your password.`,
      429,
    );
  }

  const company = await companyRepository.findByCode(companyCode);
  const user = company ? await userRepository.findForLogin(company.id, username) : null;
  // Always run a full Argon2 verification so timing does not reveal which part was wrong.
  const passwordOk = await verifyPassword(user?.passwordHash ?? null, input.password);

  const recordFailure = (reason: string) =>
    loginAttemptRepository.record({
      companyId: company?.id ?? null,
      userId: user?.id ?? null,
      companyCode,
      username,
      success: false,
      failureReason: reason,
      ...meta,
    });

  if (!company || !user || !passwordOk) {
    await recordFailure(!company ? "unknown_company" : !user ? "unknown_user" : "bad_password");
    throw INVALID_CREDENTIALS();
  }
  // Only reveal account state once the password is proven correct.
  if (company.status !== "active") {
    await recordFailure("company_inactive");
    throw new AppError("COMPANY_INACTIVE", "This company account is not active. Contact support.", 403);
  }
  if (user.status !== "active") {
    await recordFailure("user_disabled");
    throw new AppError("ACCOUNT_DISABLED", "Your account has been disabled. Contact your administrator.", 403);
  }

  if (needsRehash(user.passwordHash)) {
    await userRepository.update(company.id, user.id, { passwordHash: await hashPassword(input.password) });
  }

  const session = await startSession({ userId: user.id, companyId: company.id, meta });
  await userRepository.update(company.id, user.id, { lastLoginAt: new Date() });
  await loginAttemptRepository.record({
    companyId: company.id,
    userId: user.id,
    companyCode,
    username,
    success: true,
    ...meta,
  });
  await recordAuditSafe({
    companyId: company.id,
    userId: user.id,
    action: AUDIT_ACTIONS.login,
    entityType: "session",
    entityId: session.sessionId,
    meta,
  });
  return session;
}

// ─── Logout everywhere ──────────────────────────────────────────────────────

export async function logoutAll(auth: AuthContext, meta: RequestMeta) {
  const count = await sessionRepository.revokeAllForUser(auth.userId, "logout_all");
  await recordAuditSafe({
    companyId: auth.companyId,
    userId: auth.userId,
    action: AUDIT_ACTIONS.logoutAll,
    entityType: "user",
    entityId: auth.userId,
    newValues: { sessionsRevoked: count },
    meta,
  });
  return count;
}

// ─── Passwords ──────────────────────────────────────────────────────────────

export async function changePassword(auth: AuthContext, input: Out<typeof changePasswordSchema>, meta: RequestMeta) {
  await enforceRateLimit(`change-password:user:${auth.userId}`, RATE_LIMITS.changePasswordPerUser);

  const user = await userRepository.findForLogin(auth.companyId, auth.user.username);
  if (!user) throw Errors.unauthorized();
  if (!(await verifyPassword(user.passwordHash, input.currentPassword))) {
    throw Errors.validation({ currentPassword: ["Current password is incorrect"] }, "Current password is incorrect.");
  }
  if (input.newPassword.toLowerCase().includes(auth.user.username)) {
    throw Errors.validation({ newPassword: ["Password must not contain your username"] });
  }

  const passwordHash = await hashPassword(input.newPassword);
  await prisma.$transaction(async (tx) => {
    await userRepository.update(auth.companyId, auth.userId, { passwordHash, passwordChangedAt: new Date() }, tx);
    // Keep this device signed in; sign out every other session.
    await sessionRepository.revokeAllForUser(auth.userId, "password_changed", { exceptSessionId: auth.sessionId }, tx);
    await recordAudit(
      { companyId: auth.companyId, userId: auth.userId, action: AUDIT_ACTIONS.passwordChanged, entityType: "user", entityId: auth.userId, meta },
      tx,
    );
  });
}

const FORGOT_PASSWORD_MESSAGE =
  "If the account exists and has an email address, we've sent a password reset link. Otherwise, ask your administrator to reset your password.";

export async function requestPasswordReset(input: Out<typeof forgotPasswordSchema>, meta: RequestMeta) {
  await enforceRateLimit(`forgot-password:ip:${meta.ipAddress ?? "unknown"}`, RATE_LIMITS.forgotPasswordPerIp);

  const company = await companyRepository.findByCode(normalizeCompanyCode(input.companyCode));
  const user = company ? await userRepository.findForPasswordReset(company.id, normalizeUsername(input.username)) : null;

  // Same response whether or not the account exists (no user enumeration).
  if (!company || company.status !== "active" || !user || user.status !== "active" || !user.email) {
    return FORGOT_PASSWORD_MESSAGE;
  }

  const rawToken = generateOpaqueToken();
  await passwordResetRepository.invalidateForUser(user.id);
  await passwordResetRepository.create({
    userId: user.id,
    tokenHash: sha256Hex(rawToken),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60_000),
    requestedIp: meta.ipAddress,
  });

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const link = `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(rawToken)}`;
  await sendMail({
    to: user.email,
    subject: "Reset your Kosh password",
    text:
      `Hi ${user.fullName},\n\n` +
      `We received a request to reset the password for "${user.username}" at ${company.name} (${company.companyCode}).\n\n` +
      `Reset it here (valid for ${PASSWORD_RESET_TTL_MINUTES} minutes):\n${link}\n\n` +
      `If you didn't ask for this, you can ignore this email.`,
  });
  await recordAuditSafe({
    companyId: company.id,
    userId: user.id,
    action: AUDIT_ACTIONS.passwordResetRequested,
    entityType: "user",
    entityId: user.id,
    meta,
  });
  return FORGOT_PASSWORD_MESSAGE;
}

export async function resetPassword(input: Out<typeof resetPasswordSchema>, meta: RequestMeta) {
  await enforceRateLimit(`reset-password:ip:${meta.ipAddress ?? "unknown"}`, RATE_LIMITS.resetPasswordPerIp);

  const token = await passwordResetRepository.findByHash(sha256Hex(input.token));
  const invalid = () =>
    new AppError("RESET_TOKEN_INVALID", "This reset link is invalid or has expired. Please request a new one.", 400);
  if (!token || token.usedAt || token.expiresAt <= new Date()) throw invalid();
  if (token.user.status !== "active" || token.user.deletedAt) throw invalid();
  if (input.password.toLowerCase().includes(token.user.username)) {
    throw Errors.validation({ password: ["Password must not contain your username"] });
  }

  const passwordHash = await hashPassword(input.password);
  await prisma.$transaction(async (tx) => {
    if (!(await passwordResetRepository.markUsed(token.id, tx))) throw invalid();
    await userRepository.update(token.user.companyId, token.user.id, { passwordHash, passwordChangedAt: new Date() }, tx);
    await passwordResetRepository.invalidateForUser(token.user.id, tx);
    await sessionRepository.revokeAllForUser(token.user.id, "password_reset", {}, tx);
    await recordAudit(
      {
        companyId: token.user.companyId,
        userId: token.user.id,
        action: AUDIT_ACTIONS.passwordReset,
        entityType: "user",
        entityId: token.user.id,
        meta,
      },
      tx,
    );
  });
  logger.info("Password reset completed", { userId: token.user.id });
}

// ─── Profile ────────────────────────────────────────────────────────────────

export async function getMe(auth: AuthContext): Promise<MeDTO> {
  const locale = await getCompanyLocale(auth.companyId);
  return {
    user: { id: auth.userId, username: auth.user.username, fullName: auth.user.fullName, email: auth.user.email },
    company: { id: auth.companyId, code: auth.company.code, name: auth.company.name, ...locale },
    role: { id: auth.roleId, name: auth.roleName, key: auth.roleKey },
    isOwner: auth.isOwner,
    permissions: [...auth.permissions].sort(),
  };
}

export async function updateProfile(auth: AuthContext, input: Out<typeof updateProfileSchema>, meta: RequestMeta) {
  const before = { fullName: auth.user.fullName, email: auth.user.email };
  await prisma.$transaction(async (tx) => {
    await userRepository.update(auth.companyId, auth.userId, { fullName: input.fullName, email: input.email }, tx);
    await recordAudit(
      {
        companyId: auth.companyId,
        userId: auth.userId,
        action: AUDIT_ACTIONS.profileUpdated,
        entityType: "user",
        entityId: auth.userId,
        oldValues: before,
        newValues: { fullName: input.fullName, email: input.email },
        meta,
      },
      tx,
    );
  });
}
