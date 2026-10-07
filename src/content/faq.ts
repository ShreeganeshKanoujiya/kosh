// Questions for /faq (and a few on the landing page). Answers are plain text so they can also
// be published as FAQPage structured data. Keep them in line with how the app actually behaves.

export interface Faq {
  id: string;
  question: string;
  answer: string;
  link?: { href: string; label: string };
}

export interface FaqGroup {
  id: string;
  title: string;
  items: Faq[];
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "general",
    title: "General",
    items: [
      {
        id: "what-is-kosh",
        question: "What is Kosh?",
        answer:
          "Kosh is a web app for managing a company's petty cash. Staff record what they spend by scanning a UPI payment screenshot, typing it in or attaching the bill. Reviewers approve it, and the cash balance, reports and audit trail update on their own.",
      },
      {
        id: "who-is-it-for",
        question: "Who is Kosh for?",
        answer:
          "Businesses that pay for small things in cash or by UPI: offices, shops, clinics, schools, workshops, site teams and agencies. It works for an owner running things alone and for teams with separate cashiers, accountants and approvers.",
      },
      {
        id: "install",
        question: "Do I need to install an app?",
        answer:
          "No. Kosh runs in the browser on phones, tablets and computers. On a phone you can add it to your home screen so it opens full-screen like an app.",
        link: { href: "/help/using-kosh-on-your-phone", label: "Using Kosh on your phone" },
      },
      {
        id: "payments",
        question: "Does Kosh make payments or connect to my bank?",
        answer:
          "No. Kosh is a record-keeping tool. It doesn't send money, read your bank account or connect to your UPI apps. You record payments that have already been made, and Kosh keeps the books.",
      },
      {
        id: "currency",
        question: "Which currencies does Kosh support?",
        answer:
          "Indian rupees by default. A company can switch to US dollars, euros, British pounds, UAE dirhams or Singapore dollars in its settings. The financial year starts in April by default and can be changed.",
      },
    ],
  },
  {
    id: "getting-started",
    title: "Getting started",
    items: [
      {
        id: "set-up",
        question: "How do I set up my company?",
        answer:
          "Choose \"Create your company\" and enter the company name, your name, email, a username and a password. Kosh creates the company with eight starter categories and a Main Cash account, makes you its Owner, and shows your company code.",
        link: { href: "/help/getting-started", label: "Setting up your company" },
      },
      {
        id: "company-code",
        question: "What is a company code?",
        answer:
          "A 6-character code that identifies your company. Everyone logs in with the company code plus their own username and password, so usernames only need to be unique inside your company. It's shown when you create the company; anyone signed in can see it again in the account menu.",
      },
      {
        id: "add-team",
        question: "How do I add my team?",
        answer:
          "Open Users and choose Add user. Enter their name, a username, an optional email, a role and a temporary password, then share the company code, username and password with them. They can change the password later in Settings → Security.",
        link: { href: "/help/users-and-roles", label: "Managing users and roles" },
      },
      {
        id: "self-signup",
        question: "Can staff sign up by themselves?",
        answer:
          "No. \"Create your company\" always creates a new, separate company. Staff accounts are added by the owner or by anyone whose role allows them to create users.",
      },
    ],
  },
  {
    id: "recording",
    title: "Recording expenses",
    items: [
      {
        id: "upi-scan",
        question: "How does UPI screenshot scanning work?",
        answer:
          "Upload the payment confirmation screenshot. Kosh reads the amount, date, time, payee, UPI ID and transaction ID (UTR) and fills them into the entry form. Each value shows how confident the reader is, and anything below 80% is highlighted for you to check. Nothing is saved until you press Save.",
        link: { href: "/help/scan-upi-screenshots", label: "Scanning UPI screenshots" },
      },
      {
        id: "upi-apps",
        question: "Which UPI apps can Kosh read?",
        answer:
          "Google Pay, PhonePe, Paytm, BHIM, Amazon Pay, CRED, WhatsApp, super.money and Flipkart UPI, MobiKwik, Freecharge, Airtel Thanks, JioFinance, Navi, slice and POP, plus bank apps such as SBI YONO, ICICI iMobile, HDFC PayZapp, bob World and Kotak. Screenshots from other apps often work too; just check the values before saving.",
      },
      {
        id: "ai-privacy",
        question: "Are my screenshots sent to an AI service?",
        answer:
          "No. The text is read on Kosh's own servers with open-source OCR software. Screenshots and receipts are not sent to any third-party AI or OCR service.",
      },
      {
        id: "files",
        question: "What files can I attach?",
        answer:
          "JPG, PNG, WebP and PDF files up to 4 MB each, and up to 10 per entry. Photos taken on a phone are resized before they upload, so they rarely hit the limit.",
      },
      {
        id: "duplicates",
        question: "What if the same expense is recorded twice?",
        answer:
          "Before saving, Kosh looks for an entry with the same UPI transaction ID, or the same amount, date and payee, and warns you if it finds one. It also warns when the exact same screenshot is already attached to another entry. You can open the existing entry or save anyway.",
      },
      {
        id: "cash-added",
        question: "How do I record cash put into the petty cash box?",
        answer:
          "Create an entry with the type \"Cash added\". It increases the balance once approved. To correct a balance up or down, people who can verify entries can record an Adjustment.",
      },
    ],
  },
  {
    id: "approvals",
    title: "Approvals",
    items: [
      {
        id: "flow",
        question: "How does the approval flow work?",
        answer:
          "An entry starts as a draft. When it's submitted, a reviewer can verify it and then approve it, or approve it directly. A rejected entry goes back with a reason and can be fixed and submitted again. The cash balance changes only when an entry is approved.",
        link: { href: "/help/approval-workflow", label: "How approvals work" },
      },
      {
        id: "own-entries",
        question: "Can people approve their own expenses?",
        answer:
          "No. Nobody can verify, approve or reject an entry they created. The one exception is the company owner, so a business run by one person can still close its books.",
      },
      {
        id: "turn-off",
        question: "Can I turn approvals off?",
        answer:
          "Yes. In Settings → Company, switch off \"Approval required\". Submitted entries are then approved straight away.",
      },
      {
        id: "notifications",
        question: "How do reviewers know something is waiting?",
        answer:
          "Kosh shows in-app notifications under the bell icon. Reviewers are notified when an entry is submitted or verified, and the person who created an entry is notified when it's approved or rejected, with the reason.",
      },
    ],
  },
  {
    id: "reports",
    title: "Reports and exports",
    items: [
      {
        id: "report-types",
        question: "What reports does Kosh have?",
        answer:
          "Daily, weekly and monthly spend; spend by category, by person and by payment method; cash account movement; and approval activity. Pick this month, last month, the last 30 days, this quarter, this financial year or any range up to three years.",
        link: { href: "/help/dashboard-and-reports", label: "Dashboard and reports" },
      },
      {
        id: "export",
        question: "Can I export to Excel?",
        answer:
          "Yes. Reports and the transactions list export to CSV, Excel and PDF, using whatever filters are on screen. Exporting needs the \"Export reports\" permission, which Owners, Admins and Accountants have by default.",
      },
    ],
  },
  {
    id: "security",
    title: "Security and privacy",
    items: [
      {
        id: "safe",
        question: "Is my company's data safe?",
        answer:
          "Each company's data is kept separate and checked on every request. Passwords are hashed with Argon2id, repeated failed logins lock the account for 15 minutes, sessions use short-lived rotating tokens, receipts are stored privately, and every change is written to an audit log that can't be edited.",
        link: { href: "/privacy", label: "Privacy policy" },
      },
      {
        id: "who-sees",
        question: "Who can see my company's data?",
        answer:
          "Only people with an account in your company, and only what their role allows. We don't sell your data or show ads, and the app uses no tracking or advertising cookies.",
      },
      {
        id: "forgot-password",
        question: "I forgot my password. What do I do?",
        answer:
          "Choose \"Forgot password?\" on the login page and enter your company code and username. If your account has an email address, you'll get a reset link that works once, for 30 minutes. If it doesn't, ask your company's owner or admin to reset your password.",
      },
      {
        id: "forgot-code",
        question: "I forgot our company code.",
        answer:
          "Ask anyone in your company: it's shown in their account menu. If you ticked \"Remember company code\" when you last logged in, the login form fills it in for you.",
      },
      {
        id: "locked",
        question: "Why can't I log in after several attempts?",
        answer:
          "After 5 wrong passwords for the same username within 15 minutes, Kosh blocks further attempts for 15 minutes to protect the account. Wait and try again, or reset your password.",
      },
      {
        id: "close-account",
        question: "How do I close our account and delete our data?",
        answer:
          "Export what you need first from Reports or Transactions. Then ask us to close the company from the owner's email address, and we'll delete its data as described in the Privacy Policy.",
      },
    ],
  },
];

/** The questions shown on the landing page. */
export const FEATURED_FAQ_IDS = ["what-is-kosh", "payments", "upi-scan", "ai-privacy", "own-entries", "export"];

export const FEATURED_FAQS = FAQ_GROUPS.flatMap((g) => g.items).filter((f) => FEATURED_FAQ_IDS.includes(f.id));
