// Calendar helpers that work on "YYYY-MM-DD" strings in the *company's* timezone.
// Entry dates are local calendar dates (a ₹450 purchase on 25 Sep in Mumbai is 25 Sep,
// whatever the server's clock says). Shared by server and client.

export type Ymd = string;

const ymdFormatters = new Map<string, Intl.DateTimeFormat>();
const hmFormatters = new Map<string, Intl.DateTimeFormat>();

export function ymdInTimeZone(date: Date, timeZone: string): Ymd {
  let f = ymdFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
    ymdFormatters.set(timeZone, f);
  }
  return f.format(date); // en-CA formats as YYYY-MM-DD
}

export function hmInTimeZone(date: Date, timeZone: string): string {
  let f = hmFormatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
    hmFormatters.set(timeZone, f);
  }
  return f.format(date);
}

export const todayYmd = (timeZone: string) => ymdInTimeZone(new Date(), timeZone);

/** Date-only arithmetic in UTC so DST never shifts a calendar day. */
function parse(ymd: Ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
const fmt = (d: Date): Ymd => d.toISOString().slice(0, 10);

export function addDays(ymd: Ymd, days: number): Ymd {
  const d = parse(ymd);
  d.setUTCDate(d.getUTCDate() + days);
  return fmt(d);
}

export function addMonths(ymd: Ymd, months: number): Ymd {
  const d = parse(ymd);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return fmt(d);
}

export const startOfMonth = (ymd: Ymd): Ymd => `${ymd.slice(0, 7)}-01`;
export const endOfMonth = (ymd: Ymd): Ymd => addDays(addMonths(startOfMonth(ymd), 1), -1);

/** Weeks start on Monday (ISO / Indian business convention). */
export function startOfWeek(ymd: Ymd): Ymd {
  const dow = parse(ymd).getUTCDay(); // 0 = Sunday
  return addDays(ymd, dow === 0 ? -6 : 1 - dow);
}

export function daysBetween(from: Ymd, to: Ymd) {
  return Math.round((parse(to).getTime() - parse(from).getTime()) / 86_400_000);
}

/** Prisma maps @db.Date to a JS Date at UTC midnight. */
export const ymdToDate = (ymd: Ymd) => parse(ymd);
export const dateToYmd = (date: Date): Ymd => fmt(date);

export type DatePreset = "today" | "this_week" | "this_month" | "last_month";

export const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "this_week", label: "This week" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
];

export function presetRange(preset: DatePreset, today: Ymd): { from: Ymd; to: Ymd } {
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "this_week":
      return { from: startOfWeek(today), to: today };
    case "this_month":
      return { from: startOfMonth(today), to: today };
    case "last_month": {
      const start = addMonths(startOfMonth(today), -1);
      return { from: start, to: endOfMonth(start) };
    }
  }
}

/** Which preset (if any) a from/to pair corresponds to. */
export function matchPreset(from: Ymd | undefined, to: Ymd | undefined, today: Ymd): DatePreset | null {
  if (!from || !to) return null;
  for (const { value } of DATE_PRESETS) {
    const r = presetRange(value, today);
    if (r.from === from && r.to === to) return value;
  }
  return null;
}

export function startOfQuarter(ymd: Ymd): Ymd {
  const m = Number(ymd.slice(5, 7));
  const q = Math.floor((m - 1) / 3) * 3 + 1;
  return `${ymd.slice(0, 4)}-${String(q).padStart(2, "0")}-01`;
}

/** Indian companies usually start the financial year in April (startMonth = 4). */
export function startOfFinancialYear(ymd: Ymd, startMonth: number): Ymd {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(5, 7));
  const fy = m >= startMonth ? y : y - 1;
  return `${fy}-${String(startMonth).padStart(2, "0")}-01`;
}
