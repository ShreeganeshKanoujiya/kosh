import "server-only";
import { REFRESH_REUSE_GRACE_SECONDS } from "@/config/auth";
import { isPermissionKey, type PermissionKey } from "@/config/permissions";
import { Errors } from "@/lib/api/errors";
import type { IssuedTokens } from "@/lib/auth/cookies";
import { signAccessToken, type AccessTokenClaims } from "@/lib/auth/jwt";
import { generateOpaqueToken, sha256Hex } from "@/lib/auth/tokens";
import { prisma, type DbClient } from "@/lib/db/prisma";
import type { RequestMeta } from "@/lib/security/request-meta";
import { loginAttemptRepository } from "@/repositories/login-attempt.repository";
import { refreshTokenRepository, sessionRepository } from "@/repositories/session.repository";
import type { AuthContext } from "@/types/auth";
import type { LoginAttemptDTO, SessionDTO } from "@/types/dto";
import { AUDIT_ACTIONS, recordAuditSafe } from "./audit.service";

const DAY_MS = 24 * 60 * 60 * 1000;
const refreshTtlMs = () => Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7) * DAY_MS;
const sessionMaxAgeMs = () => Number(process.env.SESSION_MAX_AGE_DAYS ?? 30) * DAY_MS;

export interface StartedSession extends Required<IssuedTokens> {
  sessionId: string;
}

/** Create a session (token family) with its first refresh token and an access token. */
export async function startSession(
  input: { userId: string; companyId: string; meta: RequestMeta },
  db: DbClient = prisma,
): Promise<StartedSession> {
  const now = Date.now();
  const sessionExpiresAt = new Date(now + sessionMaxAgeMs());
  const session = await sessionRepository.create(
    { userId: input.userId, companyId: input.companyId, expiresAt: sessionExpiresAt, ...input.meta },
    db,
  );

  const refreshToken = generateOpaqueToken();
  const refreshExpiresAt = new Date(Math.min(now + refreshTtlMs(), sessionExpiresAt.getTime()));
  await refreshTokenRepository.create(
    {
      sessionId: session.id,
      userId: input.userId,
      tokenHash: sha256Hex(refreshToken),
      expiresAt: refreshExpiresAt,
      ...input.meta,
    },
    db,
  );

  const { token: accessToken } = await signAccessToken({ sub: input.userId, sid: session.id, cid: input.companyId });
  return { sessionId: session.id, accessToken, refreshToken, refreshExpiresAt };
}

export type RefreshOutcome =
  | { ok: true; tokens: IssuedTokens; sessionId: string; userId: string; companyId: string }
  | { ok: false; reason: "invalid" | "expired" | "revoked" | "reused" | "inactive" };

class ConcurrentRotationError extends Error {}

async function isIdentityActive(userId: string, companyId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, companyId, status: "active", deletedAt: null, company: { status: "active" } },
    select: { id: true },
  });
  return Boolean(user);
}

/**
 * Refresh-token rotation with reuse detection.
 *  - Valid token      → revoke it, issue a new refresh token + access token.
 *  - Rotated token presented again within a few seconds from the same client
 *                     → benign race (parallel requests); issue an access token only.
 *  - Any other reuse  → assume theft: revoke the whole family (session).
 */
export async function rotateRefreshToken(rawToken: string | undefined, meta: RequestMeta): Promise<RefreshOutcome> {
  if (!rawToken || rawToken.length > 200) return { ok: false, reason: "invalid" };

  const token = await refreshTokenRepository.findByHash(sha256Hex(rawToken));
  if (!token) return { ok: false, reason: "invalid" };

  const now = new Date();
  const session = token.session;
  if (session.revokedAt || session.expiresAt <= now) return { ok: false, reason: "revoked" };

  const identity = { userId: session.userId, companyId: session.companyId, sessionId: session.id };
  const accessOnly = async (): Promise<RefreshOutcome> => {
    if (!(await isIdentityActive(identity.userId, identity.companyId))) return { ok: false, reason: "inactive" };
    const { token: accessToken } = await signAccessToken({ sub: identity.userId, sid: identity.sessionId, cid: identity.companyId });
    return { ok: true, tokens: { accessToken }, ...identity };
  };

  if (token.revokedAt) {
    const withinGrace =
      token.replacedById !== null &&
      now.getTime() - token.revokedAt.getTime() <= REFRESH_REUSE_GRACE_SECONDS * 1000 &&
      token.userAgent === meta.userAgent;
    if (withinGrace) return accessOnly();

    await sessionRepository.revoke(session.id, "refresh_token_reuse");
    await recordAuditSafe({
      companyId: session.companyId,
      userId: session.userId,
      action: AUDIT_ACTIONS.refreshTokenReuse,
      entityType: "session",
      entityId: session.id,
      meta,
    });
    return { ok: false, reason: "reused" };
  }

  if (token.expiresAt <= now) return { ok: false, reason: "expired" };

  if (!(await isIdentityActive(identity.userId, identity.companyId))) {
    await sessionRepository.revoke(session.id, "identity_inactive");
    return { ok: false, reason: "inactive" };
  }

  const newRefreshToken = generateOpaqueToken();
  const refreshExpiresAt = new Date(Math.min(now.getTime() + refreshTtlMs(), session.expiresAt.getTime()));

  try {
    await prisma.$transaction(async (tx) => {
      const created = await refreshTokenRepository.create(
        {
          sessionId: session.id,
          userId: session.userId,
          tokenHash: sha256Hex(newRefreshToken),
          expiresAt: refreshExpiresAt,
          ...meta,
        },
        tx,
      );
      // Row lock + WHERE revoked_at IS NULL makes exactly one concurrent rotation win.
      if (!(await refreshTokenRepository.markRotated(token.id, created.id, tx))) {
        throw new ConcurrentRotationError();
      }
      await sessionRepository.touch(session.id, meta, tx);
    });
  } catch (error) {
    if (error instanceof ConcurrentRotationError) return accessOnly();
    throw error;
  }

  const { token: accessToken } = await signAccessToken({ sub: session.userId, sid: session.id, cid: session.companyId });
  return { ok: true, tokens: { accessToken, refreshToken: newRefreshToken, refreshExpiresAt }, ...identity };
}

/**
 * Build the AuthContext for verified access-token claims. Every protected request
 * goes through here: the session must still be live and the user/company active,
 * so logout-all, disabling a user or a role change takes effect immediately.
 */
export async function resolveAuthContext(claims: AccessTokenClaims): Promise<AuthContext | null> {
  const session = await sessionRepository.findWithIdentity(claims.sid, claims.sub);
  if (!session || session.companyId !== claims.cid) return null;
  if (session.revokedAt || session.expiresAt <= new Date()) return null;

  const { user, company } = session;
  if (user.status !== "active" || user.deletedAt || company.status !== "active") return null;

  const permissions = new Set<PermissionKey>(
    user.role.permissions.map((rp) => rp.permission.key).filter(isPermissionKey),
  );

  return {
    userId: user.id,
    companyId: company.id,
    sessionId: session.id,
    roleId: user.roleId,
    roleKey: user.role.key,
    roleName: user.role.name,
    isOwner: company.ownerUserId === user.id,
    permissions,
    user: { username: user.username, fullName: user.fullName, email: user.email, avatarPath: user.avatarPath },
    company: { code: company.companyCode, name: company.name },
  };
}

export async function revokeSessionByRefreshToken(rawToken: string | undefined, meta: RequestMeta) {
  if (!rawToken || rawToken.length > 200) return;
  const token = await refreshTokenRepository.findByHash(sha256Hex(rawToken));
  if (!token || token.session.revokedAt) return;
  await sessionRepository.revoke(token.sessionId, "logout");
  await recordAuditSafe({
    companyId: token.session.companyId,
    userId: token.session.userId,
    action: AUDIT_ACTIONS.logout,
    entityType: "session",
    entityId: token.sessionId,
    meta,
  });
}

export async function listMySessions(auth: AuthContext): Promise<SessionDTO[]> {
  const sessions = await sessionRepository.listActiveForUser(auth.userId);
  return sessions.map((s) => ({
    id: s.id,
    current: s.id === auth.sessionId,
    createdAt: s.createdAt.toISOString(),
    lastUsedAt: s.lastUsedAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    ipAddress: s.ipAddress,
    userAgent: s.userAgent,
  }));
}

export async function revokeMySession(auth: AuthContext, sessionId: string, meta: RequestMeta) {
  const session = await sessionRepository.findById(sessionId);
  if (!session || session.userId !== auth.userId || session.revokedAt) {
    throw Errors.notFound("SESSION_NOT_FOUND", "Session not found.");
  }
  await sessionRepository.revoke(sessionId, "revoked_by_user");
  await recordAuditSafe({
    companyId: auth.companyId,
    userId: auth.userId,
    action: AUDIT_ACTIONS.sessionRevoked,
    entityType: "session",
    entityId: sessionId,
    meta,
  });
  return { current: sessionId === auth.sessionId };
}

export async function listMyLoginHistory(auth: AuthContext): Promise<LoginAttemptDTO[]> {
  const attempts = await loginAttemptRepository.listForUser(auth.userId, 20);
  return attempts.map((a) => ({
    id: a.id,
    success: a.success,
    failureReason: a.failureReason,
    ipAddress: a.ipAddress,
    userAgent: a.userAgent,
    createdAt: a.createdAt.toISOString(),
  }));
}
