import type { PermissionKey } from "@/config/permissions";
import type {
  EntryAction,
  EntrySourceValue,
  EntryStatusValue,
  EntryTypeValue,
  PaymentMethodValue,
} from "@/config/entries";

// Serializable shapes returned by the API and passed from Server to Client Components.
// Dates are ISO strings; secrets (password hashes, token hashes) never appear here.

export type UserStatus = "active" | "disabled";

export interface RoleSummaryDTO {
  id: string;
  name: string;
  key: string | null;
}

export interface UserDTO {
  id: string;
  username: string;
  fullName: string;
  email: string | null;
  status: UserStatus;
  role: RoleSummaryDTO;
  isOwner: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface RoleDTO {
  id: string;
  name: string;
  key: string | null;
  description: string | null;
  isSystemRole: boolean;
  permissions: PermissionKey[];
  userCount: number;
  createdAt: string;
}

export interface PermissionDTO {
  key: PermissionKey;
  group: string;
  description: string;
}

export interface SessionDTO {
  id: string;
  current: boolean;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface LoginAttemptDTO {
  id: string;
  success: boolean;
  failureReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface MeDTO {
  user: {
    id: string;
    username: string;
    fullName: string;
    email: string | null;
  };
  company: {
    id: string;
    code: string;
    name: string;
    timezone: string;
    currency: string;
  };
  role: RoleSummaryDTO;
  isOwner: boolean;
  permissions: PermissionKey[];
}

export interface RegisterResultDTO {
  company: { code: string; name: string };
  user: { username: string; fullName: string };
}

// ─── Phase 3: petty cash ────────────────────────────────────────────────────


export interface CompanySettingsDTO {
  companyName: string;
  companyCode: string;
  currency: string;
  timezone: string;
  financialYearStartMonth: number;
  defaultCashAccountId: string | null;
  approvalRequired: boolean;
  receiptRequired: boolean;
  /** Decimal string, e.g. "5000.00"; null = no limit. */
  maxExpenseLimit: string | null;
}

export interface CategoryDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  entryCount: number;
}

export interface CashAccountDTO {
  id: string;
  name: string;
  currency: string;
  openingBalance: string;
  currentBalance: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface UserRefDTO {
  id: string;
  fullName: string;
  username: string;
}

export interface EntryDTO {
  id: string;
  entryNumber: string;
  entryDate: string;
  entryTime: string | null;
  type: EntryTypeValue;
  /** Signed decimal string. Adjustments may be negative. */
  amount: string;
  currency: string;
  category: { id: string; name: string } | null;
  description: string | null;
  paymentMethod: PaymentMethodValue;
  merchantName: string | null;
  upiId: string | null;
  transactionId: string | null;
  referenceNumber: string | null;
  source: EntrySourceValue;
  status: EntryStatusValue;
  rejectionReason: string | null;
  autoApproved: boolean;
  cashAccount: { id: string; name: string };
  createdBy: UserRefDTO;
  verifiedBy: UserRefDTO | null;
  approvedBy: UserRefDTO | null;
  rejectedBy: UserRefDTO | null;
  submittedAt: string | null;
  verifiedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  attachmentCount: number;
  /** Actions the current user may take right now — computed server-side. */
  allowedActions: EntryAction[];
}

export interface EntryListSummary {
  count: number;
  expenseTotal: string;
  incomeTotal: string;
  adjustmentTotal: string;
}

export interface EntryListDTO {
  items: EntryDTO[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  summary: EntryListSummary;
}

export interface DuplicateCandidateDTO {
  id: string;
  entryNumber: string;
  entryDate: string;
  amount: string;
  merchantName: string | null;
  transactionId: string | null;
  status: EntryStatusValue;
}

export interface DashboardDTO {
  currency: string;
  timezone: string;
  today: string;
  cashBalance: string | null;
  cashAccounts: { id: string; name: string; balance: string }[];
  todayExpenses: string;
  monthExpenses: string;
  monthIncome: string;
  pendingApprovals: { count: number; amount: string };
  totalTransactions: number;
  activeUsers: number | null;
  trend: { date: string; amount: number }[];
  categoryBreakdown: { name: string; amount: number }[];
  paymentBreakdown: { method: PaymentMethodValue; amount: number }[];
  monthly: { month: string; expense: number; income: number }[];
  recent: EntryDTO[];
}

// ─── Phase 4: reports & audit ──────────────────────────────────────────────

export type ReportColumnKind = "text" | "date" | "money" | "number" | "percent" | "duration";

export interface ReportColumn {
  key: string;
  label: string;
  kind: ReportColumnKind;
}

export type ReportCell = string | number | null;

/** A filter that shaped the data ("Category: Travel") — printed on every export. */
export interface ReportFilter {
  label: string;
  value: string;
}

/** Generic tabular report — rendered on screen and serialised by every exporter. */
export interface ReportDTO {
  type: string;
  title: string;
  subtitle: string;
  currency: string;
  filters: ReportFilter[];
  columns: ReportColumn[];
  rows: Record<string, ReportCell>[];
  totals: Record<string, ReportCell> | null;
  /** Column to plot for time-series reports (optional). */
  chart: { xKey: string; yKey: string } | null;
  generatedAt: string;
}

// ─── Phase 6: exports ──────────────────────────────────────────────────────

export interface SheetsConnectionDTO {
  /** The server has a Google service account configured. */
  configured: boolean;
  /** Share the spreadsheet with this address (Editor) so Kosh can write to it. */
  serviceAccountEmail: string | null;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
}

export interface SheetsExportDTO {
  /** Link straight to the new tab. */
  url: string;
  sheetTitle: string;
  rows: number;
}

export interface AuditLogDTO {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  user: { id: string; fullName: string; username: string } | null;
  oldValues: unknown;
  newValues: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}
