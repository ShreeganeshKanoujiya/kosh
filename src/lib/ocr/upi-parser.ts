// UPI screenshot parser: turns OCR'd text lines into entry fields with a confidence each.
// Pure (no I/O) so it can be tested against sample text. Covers the receipt layouts of
// Google Pay, PhonePe, Paytm, BHIM, Amazon Pay, Flipkart UPI / super.money, CRED, WhatsApp,
// MobiKwik, Freecharge, Airtel Thanks and bank apps (SBI YONO, iMobile, …); anything it can't
// find stays empty for the user to fill in on the review screen. `npm run ocr:check` runs it
// on real screenshots.

/** Fields below this confidence are highlighted for the user to check. */
export const LOW_CONFIDENCE = 80;

export const UPI_FIELDS = ["amount", "entryDate", "entryTime", "merchantName", "upiId", "transactionId", "referenceNumber", "description"] as const;
export type UpiField = (typeof UPI_FIELDS)[number];

export interface DetectedField {
  value: string | null;
  /** 0–100: Tesseract's confidence in the text, reduced when the value was inferred rather than labelled. */
  confidence: number;
}

export interface UpiExtraction {
  app: string | null;
  direction: "paid" | "received" | "unknown";
  status: "success" | "pending" | "failed" | "unknown";
  fields: Record<UpiField, DetectedField>;
}

export interface OcrLine {
  text: string;
  /** Tesseract line confidence, 0–100. */
  confidence: number;
  /** Row height in px — the amount is usually the largest text on screen. */
  height: number;
  top: number;
}

const NONE: DetectedField = { value: null, confidence: 0 };
const score = (lineConfidence: number, factor: number) => Math.max(0, Math.min(100, Math.round(lineConfidence * factor)));
const found = (value: string, line: OcrLine, factor: number): DetectedField => ({ value, confidence: score(line.confidence, factor) });

// ─── Amount ────────────────────────────────────────────────────────────────

const MONEY = String.raw`(\d{1,3}(?:,\d{2,3})+|\d{1,12})(?:\.(\d{1,2}))?`;
/**
 * ₹ isn't in Tesseract's English model: a detached one comes back as "X", "¥", "%", "&", "?"
 * or "Z" (an attached one as a digit — the OCR step restores those); "Rs"/"INR" are spelled
 * out by some banks.
 */
const CURRENCY = String.raw`(?:₹|rs\.?|inr|[%&?zZX¥])`;

/** Money that isn't the payment itself: cashback banners, rewards, balances, offers. */
const NOT_THE_PAYMENT = /cash\s?back|reward|scratch|super\s?coins?|\bcoins?\b|\bwon\b|earned|balance|\boffers?\b|discount|\bsaved?\b|savings|\blimit\b|bonus|points/i;

function toAmount(whole: string, fraction?: string) {
  const n = Number(`${whole.replace(/,/g, "")}.${fraction ?? "0"}`);
  return n > 0 && n < 1e12 ? n.toFixed(2) : null;
}

function findAmount(lines: OcrLine[]): DetectedField {
  const candidates: { value: string; confidence: number }[] = [];

  for (const [i, line] of lines.entries()) {
    if (NOT_THE_PAYMENT.test(line.text)) continue;
    // A label on its own line with the number under it ("Amount Paid" / "₹399").
    const label = lines[i - 1]?.text;
    const bare = new RegExp(String.raw`^(?:${CURRENCY}|[^\w\s])?\s*${MONEY}\s*$`, "i").exec(line.text);
    if (bare && label && /^\W?(?:total\s+)?(?:amount(?:\s+(?:paid|sent|received|debited|transferred))?|you\s+paid|paid|total)\s*:?\s*$/i.test(label)) {
      const v = toAmount(bare[1], bare[2]);
      if (v) candidates.push({ value: v, confidence: score(line.confidence, 1) });
    }
    // "Amount ₹450.00" / "Amount: 450" / "Total Amount Rs. 1,250" / "Amount Paid ₹399"
    const labelled = new RegExp(
      String.raw`\b(?:total\s+)?amount\s*(?:paid|sent|received|debited|credited|transferred)?\s*[:\-]?\s*(?:${CURRENCY}|[^\w\s])?\s*${MONEY}\b`,
      "i",
    ).exec(line.text);
    if (labelled) {
      const v = toAmount(labelled[1], labelled[2]);
      if (v) candidates.push({ value: v, confidence: score(line.confidence, 1) });
    }
    // "₹450" anywhere on a line (a real ₹ is trusted more than a look-alike)
    for (const m of line.text.matchAll(new RegExp(String.raw`(?:^|[\s(])(${CURRENCY})\s?${MONEY}(?![\d/:])`, "gi"))) {
      const v = toAmount(m[2], m[3]);
      if (!v) continue;
      const real = /₹|rs|inr/i.test(m[1]);
      candidates.push({ value: v, confidence: score(line.confidence, real ? 1 : 0.85) });
    }
  }

  // The big number at the top of the receipt: the tallest line that is only a number. It has to
  // really stand out, and be grouped like an amount ("₹40,000" — apps always add the commas),
  // so a fragment of a reference number on a poor image isn't mistaken for it.
  const heights = lines.map((l) => l.height).sort((a, b) => a - b);
  const median = heights[Math.floor(heights.length / 2)] ?? 0;
  const tallest = [...lines].sort((a, b) => b.height - a.height).slice(0, 3);
  for (const line of tallest) {
    if (NOT_THE_PAYMENT.test(line.text)) continue;
    const m = new RegExp(String.raw`^[^\w\s]?\s*${MONEY}\s*$`).exec(line.text);
    if (!m) continue;
    const v = toAmount(m[1], m[2]);
    if (!v || m[1].replace(/,/g, "").length > 9) continue;
    const grouped = m[1].includes(",") || Boolean(m[2]);
    if (m[1].length >= 4 && !grouped) continue;
    // A short bare number must be clearly the biggest text; a grouped one ("7,500") is safe anyway.
    if (!grouped && line.height < median * 1.4) continue;
    // "₹450" misread as "2450": if the same number without its first digit was seen elsewhere, use that.
    const shorter = m[1].length > 1 ? toAmount(m[1].slice(1).replace(/^,/, ""), m[2]) : null;
    if (shorter && candidates.some((c) => c.value === shorter)) continue;
    candidates.push({ value: v, confidence: score(line.confidence, 0.9) });
  }

  if (!candidates.length) return NONE;
  // Agreement between independent sightings (PhonePe and Paytm repeat the amount) raises confidence.
  const byValue = new Map<string, { value: string; best: number; count: number }>();
  for (const c of candidates) {
    const entry = byValue.get(c.value) ?? { value: c.value, best: 0, count: 0 };
    entry.best = Math.max(entry.best, c.confidence);
    entry.count++;
    byValue.set(c.value, entry);
  }
  const ranked = [...byValue.values()].sort((a, b) => b.count - a.count || b.best - a.best);
  const top = ranked[0];
  const contested = ranked.length > 1 && ranked[1].count === top.count;
  const confidence = Math.min(100, top.best + (top.count - 1) * 4) * (contested ? 0.7 : 1);
  return { value: top.value, confidence: Math.round(confidence) };
}

// ─── Date & time ───────────────────────────────────────────────────────────

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH_RE = String.raw`(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?`;

const pad = (n: number) => String(n).padStart(2, "0");

function validYmd(y: number, m: number, d: number) {
  const iso = `${y}-${pad(m)}-${pad(d)}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : null;
}

/** A date shown without a year is the most recent such date that isn't after today. */
function withYear(m: number, d: number, today: string) {
  const year = Number(today.slice(0, 4));
  const thisYear = validYmd(year, m, d);
  return thisYear && thisYear <= today ? thisYear : validYmd(year - 1, m, d);
}

function shiftDays(ymd: string, days: number) {
  const date = new Date(`${ymd}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function findDate(lines: OcrLine[], today: string): DetectedField {
  for (const line of lines) {
    const t = line.text.toLowerCase();
    let m: RegExpExecArray | null;
    let value: string | null = null;
    let factor = 1;

    // Year as "2026", or "'26" (CRED and others).
    const year = (full?: string, short?: string) => (full ? Number(full) : short ? 2000 + Number(short) : null);
    const YEAR = String.raw`(?:(\d{4})|['’‘\`´]\s?(\d{2}))?`;
    // Day and month may be joined by a space, "-", or a smudge OCR reads as ":" / "." ("12:Aug").
    if ((m = new RegExp(String.raw`\b(\d{1,2})(?:st|nd|rd|th)?[\s\-.:]*${MONTH_RE}[\s,\-]*${YEAR}(?!\d)`).exec(t))) {
      const month = MONTHS.indexOf(m[2]) + 1;
      const y = year(m[3], m[4]);
      value = y ? validYmd(y, month, Number(m[1])) : withYear(month, Number(m[1]), today);
      if (!y) factor = 0.85;
    } else if ((m = new RegExp(String.raw`\b${MONTH_RE}\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*${YEAR}(?!\d)`).exec(t))) {
      const month = MONTHS.indexOf(m[1]) + 1;
      const y = year(m[3], m[4]);
      value = y ? validYmd(y, month, Number(m[2])) : withYear(month, Number(m[2]), today);
      if (!y) factor = 0.85;
    } else if ((m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(t))) {
      value = validYmd(Number(m[1]), Number(m[2]), Number(m[3]));
    } else if ((m = /\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4}|\d{2})\b/.exec(t))) {
      // Indian apps write day first.
      const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      value = validYmd(year, Number(m[2]), Number(m[1]));
      factor = 0.95;
    } else if (/\btoday\b/.test(t) && /\d{1,2}[:.]\d{2}/.test(t)) {
      value = today;
      factor = 0.9;
    } else if (/\byesterday\b/.test(t)) {
      value = shiftDays(today, -1);
      factor = 0.9;
    }

    if (value) {
      // A future date is almost always a misread digit.
      if (value > today) factor = Math.min(factor, 0.3);
      return found(value, line, factor);
    }
  }
  return NONE;
}

function findTime(lines: OcrLine[]): DetectedField {
  // Prefer an am/pm time; fall back to a bare 24-hour one that isn't part of a longer number.
  for (const line of lines) {
    // "pm" is sometimes read as "prn" / "pin" / "pn" on small or blurry text.
    const m = /\b(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s*([ap])\.?\s?(?:m|rn|in|n)\b\.?/i.exec(line.text);
    if (!m) continue;
    let h = Number(m[1]);
    const min = Number(m[2]);
    if (h < 1 || h > 12 || min > 59) continue;
    h = (h % 12) + (m[3].toLowerCase() === "p" ? 12 : 0);
    return found(`${pad(h)}:${pad(min)}`, line, 1);
  }
  for (const line of lines) {
    const m = /(?<![\d:.])([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?(?![\d:])/.exec(line.text);
    if (m) return found(`${pad(Number(m[1]))}:${m[2]}`, line, 0.9);
  }
  return NONE;
}

// ─── Parties ───────────────────────────────────────────────────────────────

/** VPA: handle@psp. Emails (a dot after the @) are excluded. */
const VPA_RE = /([a-z0-9][a-z0-9._-]{1,255})\s?@\s?([a-z][a-z0-9]{1,40})(?![a-z0-9]*\.[a-z])/gi;
const HAS_VPA = /[a-z0-9._-]{2,}\s?@\s?[a-z][a-z0-9]{1,40}/i;

type Side = "to" | "from" | null;

/** Which party a line talks about, from its label. */
function sideOf(text: string): Side {
  const t = text.toLowerCase();
  if (/\b(debited from|from|sent from|paid from|payer)\b/.test(t)) return "from";
  if (/\b(paid to|sent to|payment to|to|payee|beneficiary|credited to)\b/.test(t)) return "to";
  return null;
}

function findUpiId(lines: OcrLine[], counterparty: "to" | "from"): DetectedField {
  const hits: { value: string; line: OcrLine; side: Side }[] = [];
  let side: Side = null;
  for (const line of lines) {
    side = sideOf(line.text) ?? side;
    for (const m of line.text.matchAll(VPA_RE)) {
      const value = `${m[1]}@${m[2]}`;
      if (value.length <= 120) hits.push({ value, line, side: sideOf(line.text) ?? side });
    }
  }
  const match = hits.find((h) => h.side === counterparty);
  if (match) return found(match.value, match.line, 1);
  // Unlabelled: the first VPA that isn't clearly the other party's.
  const other = counterparty === "to" ? "from" : "to";
  const fallback = hits.find((h) => h.side !== other);
  return fallback ? found(fallback.value, fallback.line, 0.75) : NONE;
}

const NAME_JUNK = /\s*(?:[a-z0-9._-]+@[a-z][a-z0-9]*|\(.*?\)|x{2,}\d+|\*{2,}\d+|a\/c.*|upi\s*id.*|bank.*|\s+on\s+\d.*|successfully)$/i;

function cleanName(raw: string) {
  const name = raw.replace(NAME_JUNK, "").replace(/^[\s:\-–—]+|[\s:\-–—.,]+$/g, "").replace(/\s+/g, " ");
  if (!/[a-z]{2}/i.test(name) || name.length > 120 || /^(upi|vpa|bank|account|a\/c|you|your|self|me)\b/i.test(name)) return null;
  return name;
}

// A name label, but not "Payee VPA" / "Beneficiary account" and the like.
const NOT_A_NAME_LABEL = String.raw`(?!\s*(?:vpa|upi|id\b|address|account|a\/c|bank|transaction|txn|order|ref|code|category|type))`;
/** Labels that can sit anywhere in a line ("₹75 Paid to Hotel Annapurna", "Payee Name: …"). */
const NAME_LABELS = {
  to: String.raw`(?:paid\s+to|sent\s+to|payment\s+to|money\s+sent\s+to|transferred\s+to|payee(?:\s+name)?|beneficiary(?:\s+name)?|merchant(?:\s+name)?)${NOT_A_NAME_LABEL}`,
  from: String.raw`(?:received\s+from|money\s+received\s+from|payer(?:\s+name)?|sender(?:\s+name)?|remitter(?:\s+name)?)${NOT_A_NAME_LABEL}`,
};
/** Short labels that only count at the start of a line ("To: …", "From: …"). */
const LEADING_LABELS = { to: "to", from: "from" };

function findName(lines: OcrLine[], counterparty: "to" | "from"): DetectedField {
  const anywhere = new RegExp(String.raw`\b${NAME_LABELS[counterparty]}\b\s*[:\-]?\s*(.*)$`, "i");
  const leading = new RegExp(String.raw`^\W{0,2}${LEADING_LABELS[counterparty]}\b${NOT_A_NAME_LABEL}\s*[:\-]?\s*(.*)$`, "i");
  for (let i = 0; i < lines.length; i++) {
    const m = anywhere.exec(lines[i].text) ?? leading.exec(lines[i].text);
    if (!m) continue;
    const rest = m[1].trim();
    if (rest) {
      const name = cleanName(rest);
      if (name) return found(name, lines[i], 1);
      continue;
    }
    // "Paid to" on its own line with the name below it (PhonePe) — possibly after the amount.
    for (const next of lines.slice(i + 1, i + 3)) {
      if (HAS_VPA.test(next.text) || AMOUNT_ONLY.test(next.text)) continue;
      const name = cleanName(next.text);
      if (name) return found(name, next, 1);
      break;
    }
  }
  return NONE;
}

const AMOUNT_ONLY = new RegExp(String.raw`^\W{0,2}\s*${MONEY}\s*$`);

// ─── References ────────────────────────────────────────────────────────────

/** In a labelled number, O/o→0, I/l/|→1, S→5, B→8 are Tesseract's usual swaps. */
const digitsOnly = (s: string) => s.replace(/[Oo]/g, "0").replace(/[Il|]/g, "1").replace(/S/g, "5").replace(/B/g, "8").replace(/[\s-]/g, "");

const UTR_LABEL = String.raw`(?:upi\s*(?:transaction|txn|trans)\.?\s*(?:id|no\.?|number)|utr(?:\s*(?:no|number))?\.?|upi\s*ref(?:erence)?\.?\s*(?:no\.?|number|id)?|rrn|bank\s*ref(?:erence)?\.?\s*(?:no\.?|number)?)`;

function findUtr(lines: OcrLine[]): DetectedField {
  const label = new RegExp(String.raw`${UTR_LABEL}\s*[:#\-]?\s*([0-9OoIlSB| \-]{10,20})?`, "i");
  for (let i = 0; i < lines.length; i++) {
    const m = label.exec(lines[i].text);
    if (!m) continue;
    const sameLine = m[1] ? digitsOnly(m[1]) : "";
    if (/^\d{12}$/.test(sameLine)) return found(sameLine, lines[i], 1);
    const next = lines[i + 1] ? digitsOnly(lines[i + 1].text) : "";
    if (/^\d{12}$/.test(next)) return found(next, lines[i + 1], 1);
    if (/^\d{10,18}$/.test(sameLine)) return found(sameLine, lines[i], 0.7);
  }
  // An unlabelled 12-digit number is very likely the UTR, but check it.
  for (const line of lines) {
    const m = /(?<!\d)(\d{12})(?!\d)/.exec(line.text.replace(/(\d)\s(?=\d)/g, "$1"));
    if (m) return found(m[1], line, 0.7);
  }
  return NONE;
}

/**
 * The app's own reference, alongside the UPI one: "Google transaction ID", "Amazon Pay
 * transaction ID", "CRED transaction ID", "Txn ID", "Order ID", "Payment ID", PhonePe's T…
 * number. Lines carrying the UPI reference (UTR / UPI Ref / RRN) are skipped.
 */
const APP_REF_LABEL = /\b(?:transaction|txn|trans|payment|order)\.?\s*(?:id|no\.?|number)\b\s*[:#\-]?\s*([A-Za-z0-9][A-Za-z0-9_\-]{5,63})?/i;
const REF_VALUE = /^[A-Za-z0-9][A-Za-z0-9_\-]{5,63}$/;

function findAppReference(lines: OcrLine[], utr: string | null): DetectedField {
  const utrLabel = new RegExp(UTR_LABEL, "i");
  for (const line of lines) {
    const m = /\b(T\d{15,30})\b/.exec(line.text); // PhonePe transaction ID
    if (m && m[1] !== utr) return found(m[1], line, 0.95);
  }
  for (let i = 0; i < lines.length; i++) {
    if (utrLabel.test(lines[i].text)) continue;
    const m = APP_REF_LABEL.exec(lines[i].text);
    if (!m) continue;
    let value = m[1];
    let line = lines[i];
    const next = lines[i + 1]?.text.replace(/\s/g, "");
    if (!value && next && REF_VALUE.test(next)) {
      value = next;
      line = lines[i + 1];
    }
    // Must look like an ID (has a digit), and not be the UPI reference shown under another name.
    if (value && /\d/.test(value) && value !== utr) return found(value.slice(0, 64), line, 0.95);
  }
  return NONE;
}

/** Status, date and label lines that sit near the amount but aren't a payment note. */
const NOT_A_NOTE = /\b(successful|success|completed|pending|failed|paid|sent|received|to|from|upi|transaction|split|details|share|bank)\b|\d{1,2}[:.]\d{2}|@/i;

function findNote(lines: OcrLine[], app: string | null, payee: string | null): DetectedField {
  for (const line of lines) {
    const m = /^\W?(?:note|message|remarks?|purpose|description|for)\s*[:\-]\s*(.{2,500})$/i.exec(line.text);
    if (m) return found(m[1].trim(), line, 0.9);
  }
  // Google Pay prints the note, unlabelled, right under the big amount. A guess: always flagged.
  if (app !== "Google Pay") return NONE;
  const amountLine = lines.findIndex((l) => AMOUNT_ONLY.test(l.text) && l.height === Math.max(...lines.map((x) => x.height)));
  const next = amountLine >= 0 ? lines[amountLine + 1] : undefined;
  const note = next?.text.replace(/^["'“]|["'”]$/g, "");
  if (next && note && /[a-z]{3}/i.test(note) && !NOT_A_NOTE.test(note) && note.length <= 120 && note.toLowerCase() !== payee?.toLowerCase()) {
    return found(note, next, 0.7);
  }
  return NONE;
}

// ─── Page-level signals ────────────────────────────────────────────────────

/** Most specific first; bank names alone don't identify the app (they appear as "Debited from"). */
const APPS: [RegExp, string][] = [
  [/google\s*pay|\bg\s?pay\b|google\s*transaction/i, "Google Pay"],
  [/phone\s?pe/i, "PhonePe"],
  [/pay\s?tm/i, "Paytm"],
  [/\bbhim\b/i, "BHIM"],
  [/amazon\s*pay|\bamazon\b/i, "Amazon Pay"],
  [/super\s?\.?\s?money/i, "super.money"],
  [/flipkart/i, "Flipkart UPI"],
  [/\bcred\b/i, "CRED"],
  [/whats\s?app/i, "WhatsApp"],
  [/mobi\s?kwik/i, "MobiKwik"],
  [/free\s?charge/i, "Freecharge"],
  [/airtel/i, "Airtel Thanks"],
  [/\bjio\s?(?:pay|finance)\b/i, "JioFinance"],
  [/\bnavi\b/i, "Navi"],
  [/\bslice\b/i, "slice"],
  [/\bpop\s?upi\b|\bpopclub\b/i, "POP"],
  [/\byono\b/i, "SBI YONO"],
  [/\bimobile\b/i, "ICICI iMobile"],
  [/pay\s?zapp/i, "HDFC PayZapp"],
  [/\bbob\s?world\b/i, "bob World"],
  [/\bkotak\b.*\b(?:811|mobile banking)\b/i, "Kotak"],
];

function detectApp(text: string): string | null {
  // Ignore UPI IDs: paying "shop@paytm" from Google Pay isn't a Paytm receipt.
  const visible = text.replace(new RegExp(VPA_RE.source, "gi"), " ");
  for (const [re, name] of APPS) if (re.test(visible)) return name;
  // Every receipt names a bank ("Debited from …"); only bank-app wording identifies a bank app.
  if (/\b(beneficiary|remitter|debit\s+account|credit\s+account|payee\s+vpa)\b/i.test(visible)) return "Bank app";
  return null;
}

function detectStatus(text: string): UpiExtraction["status"] {
  if (/\b(failed|declined|unsuccessful|failure|reversed)\b/i.test(text)) return "failed";
  if (/\b(pending|processing|in progress|awaiting)\b/i.test(text)) return "pending";
  if (/\b(successful(ly)?|success|completed|paid|sent|received|credited|debited)\b/i.test(text)) return "success";
  return "unknown";
}

function detectDirection(text: string): UpiExtraction["direction"] {
  if (/\b(received from|money received|credited to your|payment received|received)\b/i.test(text) && !/\b(paid to|sent to)\b/i.test(text)) {
    return "received";
  }
  if (/\b(paid|sent|debited|payment to|to)\b/i.test(text)) return "paid";
  return "unknown";
}

/** Null when the text doesn't look like a payment confirmation (no amount, or no payment signals at all). */
export function parseUpiText(lines: OcrLine[], today: string): UpiExtraction | null {
  const text = lines.map((l) => l.text).join("\n");
  const amount = findAmount(lines);
  if (!amount.value) return null;

  const app = detectApp(text);
  const status = detectStatus(text);
  const direction = detectDirection(text);
  const counterparty = direction === "received" ? "from" : "to";
  const transactionId = findUtr(lines);
  const upiId = findUpiId(lines, counterparty);
  if (!app && status === "unknown" && !transactionId.value && !upiId.value) return null;
  const merchantName = findName(lines, counterparty);

  return {
    app,
    direction,
    status,
    fields: {
      amount,
      entryDate: findDate(lines, today),
      entryTime: findTime(lines),
      merchantName,
      upiId,
      transactionId,
      referenceNumber: findAppReference(lines, transactionId.value),
      description: findNote(lines, app, merchantName.value),
    },
  };
}
