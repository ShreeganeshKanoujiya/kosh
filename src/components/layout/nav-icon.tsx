import {
  BarChart3,
  CheckCheck,
  House,
  ReceiptText,
  Settings,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { NavIcon } from "@/config/navigation";

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  home: House,
  transactions: ReceiptText,
  approvals: CheckCheck,
  reports: BarChart3,
  users: Users,
  categories: Tags,
  settings: Settings,
};
