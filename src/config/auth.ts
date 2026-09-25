/**
 * Auth constants shared by the proxy, route handlers and services.
 * Cookie names use the `__Host-` prefix in production: the browser then refuses
 * the cookie unless it is Secure, host-only and Path=/.
 */
const secure = process.env.NODE_ENV === "production";

export const AUTH_COOKIES = {
  access: secure ? "__Host-kosh_at" : "kosh_at",
  refresh: secure ? "__Host-kosh_rt" : "kosh_rt",
} as const;

export const COOKIE_SECURE = secure;

export const JWT_ISSUER = "kosh";
export const JWT_AUDIENCE = "kosh-app";

/** A rotated refresh token presented again within this window is treated as a benign race, not theft. */
export const REFRESH_REUSE_GRACE_SECONDS = 20;

export const LOGIN_LOCKOUT = {
  /** Failed attempts for one company+username before a temporary lock. */
  maxFailures: 5,
  windowMinutes: 15,
} as const;

export const RATE_LIMITS = {
  loginPerIp: { limit: 20, windowSeconds: 15 * 60 },
  registerPerIp: { limit: 5, windowSeconds: 60 * 60 },
  forgotPasswordPerIp: { limit: 5, windowSeconds: 15 * 60 },
  resetPasswordPerIp: { limit: 10, windowSeconds: 15 * 60 },
  refreshPerIp: { limit: 120, windowSeconds: 60 },
  changePasswordPerUser: { limit: 5, windowSeconds: 15 * 60 },
} as const;

export const PASSWORD_RESET_TTL_MINUTES = 30;

export const PUBLIC_PAGES = ["/login", "/register", "/forgot-password", "/reset-password"] as const;

/** API routes that must work without a valid access token (and must not trigger a proxy refresh). */
export const PUBLIC_API_PREFIXES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
] as const;
