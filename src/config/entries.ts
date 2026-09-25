// Shared labels/options for petty cash entries (client + server).

export const ENTRY_TYPES = ["expense", "income", "adjustment"] as const;
export type EntryTypeValue = (typeof ENTRY_TYPES)[number];

export const ENTRY_STATUSES = ["draft", "submitted", "pending_approval", "approved", "rejected", "cancelled"] as const;
export type EntryStatusValue = (typeof ENTRY_STATUSES)[number];

export const PAYMENT_METHODS = ["cash", "upi", "card", "bank_transfer", "other"] as const;
export type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

export const ENTRY_SOURCES = ["manual", "upi_screenshot", "import"] as const;
export type EntrySourceValue = (typeof ENTRY_SOURCES)[number];

export const ENTRY_TYPE_LABELS: Record<EntryTypeValue, string> = {
  expense: "Expense",
  income: "Cash added",
  adjustment: "Adjustment",
};

export const STATUS_LABELS: Record<EntryStatusValue, string> = {
  draft: "Draft",
  submitted: "Submitted",
  pending_approval: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const STATUS_TONES: Record<EntryStatusValue, "neutral" | "info" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  submitted: "info",
  pending_approval: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodValue, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank transfer",
  other: "Other",
};

export const SOURCE_LABELS: Record<EntrySourceValue, string> = {
  manual: "Manual",
  upi_screenshot: "UPI screenshot",
  import: "Import",
};

/** Statuses that count as "recorded spend" on the dashboard (approved balance uses approved only). */
export const COUNTED_STATUSES: EntryStatusValue[] = ["submitted", "pending_approval", "approved"];
export const AWAITING_REVIEW_STATUSES: EntryStatusValue[] = ["submitted", "pending_approval"];

/** Rows per page on the transactions list (server prefetch and client fetches must agree). */
export const ENTRY_PAGE_SIZE = 25;

export type EntryAction = "edit" | "submit" | "verify" | "approve" | "reject" | "cancel" | "delete";

export const CURRENCIES = [
  { code: "INR", label: "Indian Rupee (₹)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "AED", label: "UAE Dirham" },
  { code: "SGD", label: "Singapore Dollar" },
] as const;

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Europe/London",
  "America/New_York",
  "UTC",
] as const;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
