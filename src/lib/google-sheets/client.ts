import "server-only";
import { importPKCS8, SignJWT } from "jose";
import { env } from "@/config/env";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_URL = "https://sheets.googleapis.com/v4/spreadsheets";
const SCOPE = "https://www.googleapis.com/auth/spreadsheets";

/** A failed Google API call; `status` is the HTTP status Google answered with. */
export class GoogleApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "GoogleApiError";
    this.status = status;
  }
}

export interface ServiceAccount {
  email: string;
  privateKey: string;
}

/** The configured service account, or null when Google Sheets export isn't set up on this server. */
export function serviceAccount(): ServiceAccount | null {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL: email, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: key } = env();
  if (!email || !key) return null;
  // .env files carry the PEM on one line with literal "\n" sequences.
  return { email, privateKey: key.replace(/\\n/g, "\n") };
}

let cachedToken: { email: string; value: string; expiresAt: number } | null = null;

/** OAuth 2.0 service-account flow: a self-signed RS256 JWT exchanged for a 1-hour access token. */
async function accessToken(sa: ServiceAccount): Promise<string> {
  if (cachedToken && cachedToken.email === sa.email && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;

  const key = await importPKCS8(sa.privateKey, "RS256");
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.email)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    // 400/401 here mean the credentials themselves are wrong — report as 401 so callers treat it as misconfiguration.
    throw new GoogleApiError(res.status === 400 ? 401 : res.status, `Google token exchange failed (${res.status})`);
  }
  const body = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { email: sa.email, value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  return body.access_token;
}

async function call<T>(sa: ServiceAccount, path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${SHEETS_URL}/${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${await accessToken(sa)}`,
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    const detail = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new GoogleApiError(res.status, detail?.error?.message ?? `Google Sheets API error (${res.status})`);
  }
  return (await res.json()) as T;
}

export interface SpreadsheetInfo {
  properties: { title: string };
  sheets?: { properties: { sheetId: number; title: string } }[];
}

export const sheetsApi = {
  getSpreadsheet(sa: ServiceAccount, spreadsheetId: string) {
    const fields = encodeURIComponent("properties.title,sheets.properties(sheetId,title)");
    return call<SpreadsheetInfo>(sa, `${encodeURIComponent(spreadsheetId)}?fields=${fields}`);
  },

  /** Requests in one batchUpdate are applied atomically — all or nothing. */
  batchUpdate(sa: ServiceAccount, spreadsheetId: string, requests: object[]) {
    return call<unknown>(sa, `${encodeURIComponent(spreadsheetId)}:batchUpdate`, { method: "POST", body: { requests } });
  },
};

export const spreadsheetUrl = (spreadsheetId: string, sheetId?: number) =>
  `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit${sheetId !== undefined ? `#gid=${sheetId}` : ""}`;

/** Accepts a full Google Sheets link or a bare spreadsheet id. */
export function parseSpreadsheetId(input: string): string | null {
  const text = input.trim();
  const match = /\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,128})/.exec(text) ?? /^([a-zA-Z0-9_-]{20,128})$/.exec(text);
  return match?.[1] ?? null;
}
