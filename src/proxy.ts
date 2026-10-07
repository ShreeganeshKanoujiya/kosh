import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIES, PUBLIC_API_PREFIXES, PUBLIC_PAGES } from "@/config/auth";
import { clearAuthCookies, setAuthCookies, type IssuedTokens } from "@/lib/auth/cookies";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { getRequestMeta } from "@/lib/security/request-meta";
import { rotateRefreshToken } from "@/services/session.service";

const matches = (pathname: string, prefixes: readonly string[]) =>
  prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

/**
 * Transparent session renewal + optimistic page protection.
 *
 * The access token is verified cryptographically here (no DB). Only when it is
 * missing/expired and a refresh cookie exists do we hit the database to rotate
 * the refresh token — at most once per access-token lifetime.
 *
 * This is NOT the authorisation boundary: every page and route handler still
 * resolves the session from the database via getAuthContext().
 */
export async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (isApi && matches(pathname, PUBLIC_API_PREFIXES)) return NextResponse.next();

  const access = await verifyAccessToken(req.cookies.get(AUTH_COOKIES.access)?.value);
  let authenticated = access.valid;
  let renewed: IssuedTokens | null = null;
  let clearCookies = false;

  const isProtectedPage = !isApi && !matches(pathname, PUBLIC_PAGES);
  const refreshToken = req.cookies.get(AUTH_COOKIES.refresh)?.value;
  if (!authenticated && refreshToken) {
    let outcome: Awaited<ReturnType<typeof rotateRefreshToken>>;
    try {
      outcome = await rotateRefreshToken(refreshToken, getRequestMeta(req.headers));
    } catch (error) {
      // Public pages don't need a session, so a database outage mustn't take them down.
      // The cookies are left alone: the token may still be good once the database is back.
      if (isApi || isProtectedPage) throw error;
      return NextResponse.next();
    }
    if (outcome.ok) {
      authenticated = true;
      renewed = outcome.tokens;
    } else {
      clearCookies = true;
    }
  }

  if (!authenticated && isProtectedPage) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    const res = NextResponse.redirect(loginUrl);
    if (clearCookies) clearAuthCookies(res.cookies);
    return res;
  }

  // The landing page is for visitors; people who are signed in go straight to the app.
  if (authenticated && pathname === "/") {
    const res = NextResponse.redirect(new URL("/dashboard", req.url));
    if (renewed) setAuthCookies(res.cookies, renewed);
    return res;
  }

  if (renewed) {
    // Make the fresh access token visible to the page / route handler serving *this* request.
    req.cookies.set(AUTH_COOKIES.access, renewed.accessToken);
    if (renewed.refreshToken) req.cookies.set(AUTH_COOKIES.refresh, renewed.refreshToken);
    const res = NextResponse.next({ request: { headers: req.headers } });
    setAuthCookies(res.cookies, renewed);
    return res;
  }

  const res = NextResponse.next();
  if (clearCookies) clearAuthCookies(res.cookies);
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
