import { SignJWT, jwtVerify, errors as joseErrors } from "jose";
import { JWT_AUDIENCE, JWT_ISSUER } from "@/config/auth";

// No `server-only` import: this module is also used by src/proxy.ts.

export interface AccessTokenClaims {
  /** user id */
  sub: string;
  /** session id (refresh-token family) */
  sid: string;
  /** company id the session is scoped to */
  cid: string;
}

export type VerifyResult =
  | { valid: true; claims: AccessTokenClaims }
  | { valid: false; reason: "missing" | "expired" | "invalid" };

let cachedKey: Uint8Array | undefined;
function secretKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_ACCESS_SECRET must be set to at least 32 characters.");
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export function accessTokenTtlSeconds(): number {
  const minutes = Number(process.env.ACCESS_TOKEN_TTL_MINUTES ?? 15);
  return Math.min(60, Math.max(1, Number.isFinite(minutes) ? minutes : 15)) * 60;
}

export async function signAccessToken(claims: AccessTokenClaims): Promise<{ token: string; expiresAt: Date }> {
  const ttl = accessTokenTtlSeconds();
  const expiresAt = new Date(Date.now() + ttl * 1000);
  const token = await new SignJWT({ sid: claims.sid, cid: claims.cid, typ: "access" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(claims.sub)
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(secretKey());
  return { token, expiresAt };
}

export async function verifyAccessToken(token: string | undefined | null): Promise<VerifyResult> {
  if (!token) return { valid: false, reason: "missing" };
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ["HS256"],
    });
    if (
      payload.typ !== "access" ||
      typeof payload.sub !== "string" ||
      typeof payload.sid !== "string" ||
      typeof payload.cid !== "string"
    ) {
      return { valid: false, reason: "invalid" };
    }
    return { valid: true, claims: { sub: payload.sub, sid: payload.sid, cid: payload.cid } };
  } catch (error) {
    if (error instanceof joseErrors.JWTExpired) return { valid: false, reason: "expired" };
    return { valid: false, reason: "invalid" };
  }
}
