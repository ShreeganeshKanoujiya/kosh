import { AUTH_COOKIES, COOKIE_SECURE } from "@/config/auth";
import { accessTokenTtlSeconds } from "./jwt";

// No `server-only` import: this module is also used by src/proxy.ts.

/** Structural type satisfied by both `NextResponse.cookies` and `await cookies()`. */
interface CookieWriter {
  set(name: string, value: string, options: CookieOptions): unknown;
}

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict";
  path: string;
  maxAge?: number;
  expires?: Date;
}

const BASE = { httpOnly: true, secure: COOKIE_SECURE, sameSite: "lax", path: "/" } as const;

export interface IssuedTokens {
  accessToken: string;
  /** Omitted when only the access token was re-issued (refresh race grace path). */
  refreshToken?: string;
  refreshExpiresAt?: Date;
}

export function setAuthCookies(store: CookieWriter, tokens: IssuedTokens) {
  store.set(AUTH_COOKIES.access, tokens.accessToken, { ...BASE, maxAge: accessTokenTtlSeconds() });
  if (tokens.refreshToken && tokens.refreshExpiresAt) {
    store.set(AUTH_COOKIES.refresh, tokens.refreshToken, { ...BASE, expires: tokens.refreshExpiresAt });
  }
}

export function clearAuthCookies(store: CookieWriter) {
  store.set(AUTH_COOKIES.access, "", { ...BASE, maxAge: 0 });
  store.set(AUTH_COOKIES.refresh, "", { ...BASE, maxAge: 0 });
}
