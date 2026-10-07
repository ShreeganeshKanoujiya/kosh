import {
  ArrowRight,
  ChartColumn,
  Check,
  ClipboardCheck,
  CopyCheck,
  EyeOff,
  Fingerprint,
  History,
  Layers,
  Paperclip,
  ScanLine,
  ShieldCheck,
  Smartphone,
  UsersRound,
  Wallet,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { KoshWordmark } from "@/components/brand/logo";
import { FaqList } from "@/components/marketing/faq-list";
import { HeroPreview } from "@/components/marketing/hero-preview";
import { Button } from "@/components/ui/button";
import { ALL_PERMISSION_KEYS } from "@/config/permissions";
import { SITE, absoluteUrl, jsonLd } from "@/config/site";
import { FEATURED_FAQS } from "@/content/faq";

export const metadata: Metadata = {
  title: { absolute: SITE.title },
  description: SITE.description,
  alternates: { canonical: "/" },
};

const UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM", "Amazon Pay", "CRED", "WhatsApp", "super.money", "MobiKwik", "Freecharge", "Airtel Thanks", "Bank apps"];

const STEPS = [
  {
    title: "Record",
    body: "Scan a UPI screenshot, type the expense in, or photograph the bill. Kosh fills in the amount, payee, date and reference for you to check.",
  },
  {
    title: "Review",
    body: "Entries land in an approvals queue. A reviewer verifies and approves them, or sends them back with a reason to fix.",
  },
  {
    title: "Report",
    body: "The balance moves only on approval. Reports by day, category, person and payment method are ready to export to Excel, CSV or PDF.",
  },
];

const FEATURES = [
  {
    icon: ScanLine,
    title: "UPI screenshot scanning",
    body: "Upload a payment screenshot and Kosh reads the amount, payee, date, UPI ID and transaction ID, with a confidence score on each. You confirm before anything is saved.",
  },
  {
    icon: ClipboardCheck,
    title: "Approvals built in",
    body: "Draft, submit, verify, approve, or reject with a reason. Nobody reviews their own entry. Running things alone? Switch approvals off.",
  },
  {
    icon: CopyCheck,
    title: "Duplicate detection",
    body: "Warns when an entry matches an existing UPI transaction ID, or the same amount, date and payee, and when a screenshot has already been used.",
  },
  {
    icon: Paperclip,
    title: "Bills stay with the entry",
    body: "Attach receipts, bills and invoices as photos or PDFs. Files are stored privately and opened only after a permission check.",
  },
  {
    icon: Wallet,
    title: "Several cash boxes",
    body: "Keep separate cash accounts for the office, a site or a branch, each with its own opening and current balance.",
  },
  {
    icon: UsersRound,
    title: "Roles and permissions",
    body: "Owner, Admin, Accountant, Cashier and Viewer out of the box, or build your own roles from individual permissions.",
  },
  {
    icon: ChartColumn,
    title: "Reports and exports",
    body: "Daily, weekly and monthly spend, by category, person and payment method, with your financial year built in. Export to CSV, Excel or PDF.",
  },
  {
    icon: History,
    title: "A complete audit trail",
    body: "Every sign-in, edit, approval, upload and export is logged with who, when and what changed. The log can't be edited afterwards.",
  },
  {
    icon: Smartphone,
    title: "Made for phones",
    body: "A bottom tab bar, one-tap add, swipe-to-edit and light and dark themes. Add it to your home screen and it opens like an app.",
  },
];

const ROLES = [
  { name: "Owner", body: "Sets up the company and has full access, including company details." },
  { name: "Admin", body: "Manages people, roles, categories, cash accounts, settings and reports." },
  { name: "Accountant", body: "Verifies, approves and rejects entries, and runs and exports reports." },
  { name: "Cashier", body: "Records expenses and cash top-ups, and follows them through approval." },
  { name: "Viewer", body: "Sees entries, balances and reports without changing anything." },
];

const SECURITY = [
  {
    icon: Layers,
    title: "Your company, sealed off",
    body: "Every request is scoped to your company on the server, backed by database constraints and row-level security.",
  },
  {
    icon: Fingerprint,
    title: "Strong sign-in",
    body: "Argon2id password hashing, lockout after repeated failures, and short-lived sessions that rotate automatically.",
  },
  {
    icon: EyeOff,
    title: "Screenshots stay private",
    body: "Text is read on our own servers with open-source OCR. Your screenshots never go to a third-party AI service.",
  },
  {
    icon: ShieldCheck,
    title: "Nothing changes quietly",
    body: "An append-only audit log, encrypted connections and strict security headers on every page.",
  },
];

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: SITE.name,
  url: absoluteUrl("/"),
  description: SITE.description,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Expense management",
  operatingSystem: "Web browser",
  inLanguage: "en-IN",
};

function SectionHeading({ eyebrow, title, body, id }: { eyebrow: string; title: string; body?: string; id?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h2 id={id} className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {body && <p className="mt-4 text-base leading-7 text-muted-foreground">{body}</p>}
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(softwareJsonLd)} />

      {/* Hero */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl lg:left-1/4" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pt-24 lg:pb-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              Petty cash management for Indian businesses
            </p>
            <h1 id="hero-title" className="mt-5 text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              Petty cash, <span className="text-primary">in control.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Kosh replaces the petty cash notebook. Your team records spends by scanning a UPI screenshot or snapping the bill, reviewers
              approve them, and the balance, reports and audit trail keep themselves up to date.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Create your company
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/help/getting-started">See how it works</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:flex sm:flex-wrap sm:gap-x-6">
              {["Runs in any browser, no install", "Set up in about a minute", "Built for ₹ and the April–March year"].map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="size-4 text-primary" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <HeroPreview className="mx-auto w-full max-w-md lg:mr-8 lg:max-w-none" />
        </div>
      </section>

      {/* Supported apps */}
      <section aria-labelledby="apps-title" className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <h2 id="apps-title" className="text-center text-sm font-medium text-muted-foreground">
            Reads payment screenshots from the apps your team already uses
          </h2>
          <ul className="mt-4 flex flex-wrap justify-center gap-2">
            {UPI_APPS.map((app) => (
              <li key={app} className="rounded-full border bg-background px-3 py-1.5 text-sm font-medium">
                {app}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-16 py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            id="how-title"
            eyebrow="How it works"
            title="From payment to report in three steps"
            body="No more chasing bills at month-end. Every spend is captured when it happens, checked by someone else, and counted once it's approved."
          />
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="relative rounded-2xl border bg-card p-6">
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-body text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-labelledby="features-title" className="scroll-mt-16 border-t bg-card py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            id="features-title"
            eyebrow="Features"
            title="Everything petty cash needs, nothing it doesn't"
            body="Simple enough for the person holding the cash box, thorough enough for the person signing off the books."
          />
          <ul className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <li key={title}>
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-body text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Roles */}
      <section aria-labelledby="roles-title" className="border-t py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SectionHeading
            id="roles-title"
            eyebrow="For the whole team"
            title="Everyone sees what they need"
            body={`Start with five ready-made roles, or create your own from ${ALL_PERMISSION_KEYS.length} individual permissions.`}
          />
          <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ROLES.map((role) => (
              <li key={role.name} className="rounded-2xl border bg-card p-5">
                <p className="font-semibold">{role.name}</p>
                <p className="mt-1.5 text-caption">{role.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Security — always dark, like the brand panel on the login page. */}
      <section id="security" aria-labelledby="security-title" className="dark scroll-mt-16 bg-background py-20 text-foreground md:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
          <div>
            <p className="text-sm font-semibold text-primary">Security and privacy</p>
            <h2 id="security-title" className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Your books stay yours
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Petty cash records show who spent what, where and when. Kosh treats them that way: no ads, no tracking cookies, and no selling
              your data.
            </p>
            <Button asChild variant="outline" className="mt-6">
              <Link href="/privacy">Read the privacy policy</Link>
            </Button>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {SECURITY.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-2xl border bg-card p-5">
                <Icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1.5 text-caption">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-title" className="py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions people ask first" />
          <FaqList items={FEATURED_FAQS} className="mt-12" />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            More answers in the{" "}
            <Link href="/faq" className="font-medium text-primary hover:underline">
              full FAQ
            </Link>{" "}
            and the{" "}
            <Link href="/help" className="font-medium text-primary hover:underline">
              help center
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Call to action */}
      <section aria-labelledby="cta-title" className="px-4 pb-20 sm:px-6 md:pb-28">
        <div className="dark relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-background px-6 py-14 text-center text-foreground sm:px-12 md:py-20">
          <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative">
            <KoshWordmark className="mx-auto w-28" />
            <h2 id="cta-title" className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              {SITE.tagline}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground">
              Create your company, share the company code with your team, and record your first expense today.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/register">
                  Create your company
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">Log in</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
