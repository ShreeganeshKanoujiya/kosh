import type { PermissionKey } from "@/config/permissions";

export type NavIcon =
  | "home"
  | "transactions"
  | "approvals"
  | "reports"
  | "users"
  | "categories"
  | "settings";

export interface NavItem {
  href: string;
  label: string;
  /** Label under the icon on the tablet rail / mobile tab bar. */
  shortLabel: string;
  icon: NavIcon;
  /** Any of these permissions shows the item. Empty = everyone. */
  anyOf: PermissionKey[];
}

/** Primary navigation. Visibility is cosmetic — every page re-checks permissions server-side. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: "home", anyOf: [] },
  { href: "/transactions", label: "Transactions", shortLabel: "Entries", icon: "transactions", anyOf: ["transactions.read"] },
  { href: "/approvals", label: "Approvals", shortLabel: "Approvals", icon: "approvals", anyOf: ["transactions.approve", "transactions.reject", "transactions.verify"] },
  { href: "/reports", label: "Reports", shortLabel: "Reports", icon: "reports", anyOf: ["reports.read"] },
  { href: "/users", label: "Users", shortLabel: "Users", icon: "users", anyOf: ["users.read"] },
  { href: "/categories", label: "Categories", shortLabel: "Categories", icon: "categories", anyOf: ["categories.read"] },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: "settings", anyOf: [] },
];

/** Routes that exist in the current build (later phases add theirs here). */
export const AVAILABLE_ROUTES = new Set<string>(["/dashboard", "/transactions", "/approvals", "/reports", "/users", "/categories", "/settings"]);

export function visibleNavItems(permissions: readonly string[]) {
  const set = new Set(permissions);
  return NAV_ITEMS.filter(
    (item) => AVAILABLE_ROUTES.has(item.href) && (item.anyOf.length === 0 || item.anyOf.some((p) => set.has(p))),
  );
}

export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
