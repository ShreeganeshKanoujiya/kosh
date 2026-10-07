import { ChartColumn, ClipboardCheck, KeyRound, ReceiptText, Rocket, Settings2, type LucideIcon } from "lucide-react";
import { accountArticles } from "./account";
import { administrationArticles } from "./administration";
import { gettingStartedArticles } from "./getting-started";
import { recordingArticles } from "./recording";
import { approvalArticles, reportArticles } from "./review-and-report";
import type { HelpArticle, HelpCategoryId } from "./types";

export type { HelpArticle } from "./types";

export const HELP_CATEGORIES: { id: HelpCategoryId; title: string; description: string; icon: LucideIcon }[] = [
  { id: "getting-started", title: "Getting started", description: "Set up your company, log in and use Kosh on your phone.", icon: Rocket },
  { id: "recording", title: "Recording expenses", description: "Entries, UPI scanning, receipts, search and export.", icon: ReceiptText },
  { id: "approvals", title: "Approvals", description: "Submitting, verifying, approving and rejecting entries.", icon: ClipboardCheck },
  { id: "reports", title: "Balances and reports", description: "The dashboard, cash balance and reports.", icon: ChartColumn },
  { id: "administration", title: "Administration", description: "Users, roles, categories, cash accounts and settings.", icon: Settings2 },
  { id: "account", title: "Account and security", description: "Passwords, sessions and fixing common problems.", icon: KeyRound },
];

/** Every help article, in reading order (category by category). */
export const HELP_ARTICLES: HelpArticle[] = [
  ...gettingStartedArticles,
  ...recordingArticles,
  ...approvalArticles,
  ...reportArticles,
  ...administrationArticles,
  ...accountArticles,
];

export const getHelpArticle = (slug: string) => HELP_ARTICLES.find((a) => a.slug === slug);

export const articlesIn = (category: HelpCategoryId) => HELP_ARTICLES.filter((a) => a.category === category);

export const helpCategory = (id: HelpCategoryId) => HELP_CATEGORIES.find((c) => c.id === id)!;
