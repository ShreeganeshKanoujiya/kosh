/**
 * Permission catalogue — the single source of truth for authorisation keys.
 * The `permissions` table is synchronised from this list (see services/permission-catalog.service.ts).
 * Authorisation checks must always use these keys, never role names.
 */
export const PERMISSIONS = {
  "company.read": { group: "company", description: "View company profile" },
  "company.update": { group: "company", description: "Update company profile" },

  "users.create": { group: "users", description: "Create users" },
  "users.read": { group: "users", description: "View users" },
  "users.update": { group: "users", description: "Edit users, reset passwords, revoke sessions" },
  "users.delete": { group: "users", description: "Delete users" },

  "roles.read": { group: "roles", description: "View roles and permissions" },
  "roles.create": { group: "roles", description: "Create custom roles" },
  "roles.update": { group: "roles", description: "Edit custom roles" },
  "roles.delete": { group: "roles", description: "Delete custom roles" },

  "transactions.create": { group: "transactions", description: "Record petty cash entries" },
  "transactions.read": { group: "transactions", description: "View petty cash entries" },
  "transactions.update": { group: "transactions", description: "Edit petty cash entries" },
  "transactions.delete": { group: "transactions", description: "Delete petty cash entries" },
  "transactions.verify": { group: "transactions", description: "Verify entries and edit others' entries" },
  "transactions.approve": { group: "transactions", description: "Approve entries" },
  "transactions.reject": { group: "transactions", description: "Reject entries" },

  "categories.create": { group: "categories", description: "Create categories" },
  "categories.read": { group: "categories", description: "View categories" },
  "categories.update": { group: "categories", description: "Edit categories" },
  "categories.delete": { group: "categories", description: "Delete categories" },

  "cash_accounts.read": { group: "cash_accounts", description: "View cash accounts and balances" },
  "cash_accounts.manage": { group: "cash_accounts", description: "Create and edit cash accounts" },

  "reports.read": { group: "reports", description: "View reports" },
  "reports.export": { group: "reports", description: "Export reports (CSV, Excel, PDF)" },

  "google_sheets.export": { group: "google_sheets", description: "Export to Google Sheets" },
  "google_sheets.sync": { group: "google_sheets", description: "Sync to Google Sheets" },

  "audit_logs.read": { group: "audit_logs", description: "View the audit trail" },
  "settings.read": { group: "settings", description: "View company settings" },
  "settings.update": { group: "settings", description: "Change company settings" },
} as const satisfies Record<string, { group: string; description: string }>;

export type PermissionKey = keyof typeof PERMISSIONS;

export const ALL_PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];

export const PERMISSION_GROUP_LABELS: Record<string, string> = {
  company: "Company",
  users: "Users",
  roles: "Roles",
  transactions: "Transactions",
  categories: "Categories",
  cash_accounts: "Cash accounts",
  reports: "Reports",
  google_sheets: "Google Sheets",
  audit_logs: "Audit log",
  settings: "Settings",
};

export function isPermissionKey(value: string): value is PermissionKey {
  return Object.hasOwn(PERMISSIONS, value);
}

export type SystemRoleKey = "owner" | "admin" | "accountant" | "cashier" | "viewer";

export const SYSTEM_ROLES: Record<
  SystemRoleKey,
  { name: string; description: string; permissions: readonly PermissionKey[] }
> = {
  owner: {
    name: "Owner",
    description: "Full company access",
    permissions: ALL_PERMISSION_KEYS,
  },
  admin: {
    name: "Admin",
    description: "Manage users, transactions, categories, settings and reports",
    permissions: ALL_PERMISSION_KEYS.filter((k) => k !== "company.update"),
  },
  accountant: {
    name: "Accountant",
    description: "Manage and verify transactions and reports",
    permissions: [
      "company.read",
      "users.read",
      "transactions.create",
      "transactions.read",
      "transactions.update",
      "transactions.verify",
      "transactions.approve",
      "transactions.reject",
      "categories.create",
      "categories.read",
      "categories.update",
      "cash_accounts.read",
      "reports.read",
      "reports.export",
      "google_sheets.export",
      "audit_logs.read",
      "settings.read",
    ],
  },
  cashier: {
    name: "Cashier",
    description: "Record and manage their own petty cash entries",
    permissions: [
      "company.read",
      "transactions.create",
      "transactions.read",
      "transactions.update",
      "categories.read",
      "cash_accounts.read",
      "reports.read",
    ],
  },
  viewer: {
    name: "Viewer",
    description: "Read-only access",
    permissions: [
      "company.read",
      "transactions.read",
      "categories.read",
      "cash_accounts.read",
      "reports.read",
    ],
  },
};

export const SYSTEM_ROLE_ORDER: SystemRoleKey[] = ["owner", "admin", "accountant", "cashier", "viewer"];
