import Link from "next/link";
import { ContactLine } from "@/components/marketing/doc-parts";
import { LegalDocument, type LegalSection } from "@/components/marketing/legal-document";
import { SITE } from "@/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy policy",
  description:
    "What information Kosh collects, how it's used and protected, the cookies it sets, how long data is kept, and your rights under India's Digital Personal Data Protection Act.",
  path: "/privacy",
});

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          This policy covers the Kosh website and web application at {SITE.url} (the &quot;Service&quot;, and &quot;we&quot;,
          &quot;us&quot;, &quot;our&quot;).
        </p>
        <p>
          Businesses (&quot;customers&quot;) use Kosh to keep their own petty cash records. For the records a company keeps in Kosh (its users,
          entries, attachments and reports), the company decides what is recorded and why, and we process that information on its behalf and
          on its instructions. In the terms of the Digital Personal Data Protection Act, 2023 (the &quot;DPDP Act&quot;), the company is the
          data fiduciary and we are its data processor. For the information we need to run our own business, such as account owners&apos;
          contact details, sign-in security records and support requests, we are the data fiduciary.
        </p>
        <p>
          If your employer gave you a Kosh account, please send questions about the records your company keeps to your company first.
        </p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <h3>Information you or your company give us</h3>
        <ul>
          <li>
            <strong>Company details:</strong> company name, currency, timezone, financial year and approval settings.
          </li>
          <li>
            <strong>Account details:</strong> full name, username, email address (optional for staff accounts and used for password resets),
            role, and a one-way hash of the password. We never store passwords in a readable form.
          </li>
          <li>
            <strong>Petty cash records:</strong> amounts, dates, categories, descriptions, payees, UPI IDs, transaction and reference numbers,
            payment methods, cash accounts, and approval decisions with any rejection reasons.
          </li>
          <li>
            <strong>Attachments:</strong> UPI screenshots, receipts, bills and invoices. These can contain information about other people, such
            as the names, phone numbers, UPI IDs or bank details of those who were paid. Please upload only what your company needs.
          </li>
          <li>
            <strong>Messages</strong> you send us, such as support requests.
          </li>
        </ul>
        <h3>Information collected automatically</h3>
        <ul>
          <li>
            <strong>Sign-in and security records:</strong> IP address, browser and device details, the time of each sign-in attempt and its
            result, and your active sessions.
          </li>
          <li>
            <strong>Audit log:</strong> a record of each change made in a company&apos;s account: who made it, what changed, when, and from
            which IP address and device.
          </li>
          <li>
            <strong>Server logs</strong> needed to operate and secure the Service, such as errors and request details, kept for a short time.
          </li>
        </ul>
        <h3>What we don&apos;t collect</h3>
        <p>
          We don&apos;t use analytics, advertising or social media trackers, and we don&apos;t buy information about you from others. Kosh
          doesn&apos;t collect payment card details and has no access to your bank account or UPI apps.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "How we use information",
    body: (
      <>
        <ul>
          <li>
            <strong>To provide the Service:</strong> sign people in, store and display records, run approvals, calculate balances, produce
            reports and exports, and show in-app notifications.
          </li>
          <li>
            <strong>To read UPI screenshots:</strong> text recognition runs on our own servers using open-source software. Screenshots are not
            sent to third-party AI or OCR services, and they are not used to train any AI model.
          </li>
          <li>
            <strong>To send service emails,</strong> such as password-reset links. We don&apos;t send marketing emails without your consent.
          </li>
          <li>
            <strong>To keep the Service secure:</strong> detect and prevent fraud, abuse and unauthorised access (for example with rate limits
            and account lockouts) and investigate incidents.
          </li>
          <li>
            <strong>To support you</strong> and tell you about important changes to the Service, these terms or this policy.
          </li>
          <li>
            <strong>To meet legal obligations</strong> and enforce our <Link href="/terms">Terms and Conditions</Link>.
          </li>
        </ul>
        <p>
          We process personal data to provide the Service you or your company asked for, for other legitimate uses permitted by the DPDP Act,
          or with your consent. Where we rely on consent, you can withdraw it at any time; this doesn&apos;t affect processing already carried
          out. We do not sell personal data, use it for advertising, or use the contents of a company&apos;s records for anything other than
          providing the Service to that company.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <>
        <p>Kosh uses only what it needs to work:</p>
        <ul>
          <li>
            <strong>Two sign-in cookies</strong> keep you logged in: a short-lived access token and a refresh token. They are HttpOnly and
            Secure, so scripts on the page can&apos;t read them, and they are sent only to Kosh. Without them you can&apos;t sign in.
          </li>
          <li>
            <strong>Your browser&apos;s local storage</strong> keeps your theme choice and, if you tick &quot;Remember company code&quot;, your
            company code for the login form. This stays on your device and you can clear it at any time.
          </li>
        </ul>
        <p>There are no advertising, analytics or third-party cookies.</p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "How information is shared",
    body: (
      <>
        <ul>
          <li>
            <strong>Within your company:</strong> people in your company see information according to their role. For example, reviewers see
            the entries they approve, and people with access to the audit log can see who did what.
          </li>
          <li>
            <strong>Service providers:</strong> we use carefully chosen providers for cloud hosting, the database, file storage and email
            delivery. They process data only on our instructions, to run the Service, under confidentiality and security obligations.
          </li>
          <li>
            <strong>Legal reasons:</strong> when the law, a court order or a government authority requires it, or when it&apos;s needed to
            protect the rights, property or safety of our customers, others or the Service.
          </li>
          <li>
            <strong>Business transfers:</strong> if we are involved in a merger, acquisition or sale of assets, information may be transferred
            under the protections of this policy. We will tell affected customers before that happens.
          </li>
        </ul>
        <p>We never sell or rent personal data.</p>
      </>
    ),
  },
  {
    id: "where-data-is-stored",
    title: "Where data is stored",
    body: (
      <p>
        Our service providers store and process data on servers in India and in other countries. Wherever it is processed, we protect it as
        this policy describes, and we transfer data outside India only as Indian law permits.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep data",
    body: (
      <>
        <ul>
          <li>
            Records are kept while the company&apos;s account is active, because they form the company&apos;s financial records. Deleting an
            entry removes it from view in the app but keeps it in the audit trail, and the audit log is kept for the life of the account.
          </li>
          <li>Uploaded files that were never attached to an entry are deleted automatically, usually within a day.</li>
          <li>Password-reset links expire after 30 minutes. Sign-in sessions end after at most 30 days.</li>
          <li>
            When a company closes its account, we delete or anonymise its data within 90 days, unless we must keep some of it longer by law or
            to resolve a dispute. Copies in backups are overwritten on their normal schedule.
          </li>
        </ul>
        <p>
          Each company is responsible for keeping its own records for as long as accounting and tax rules require. Export them before closing
          the account.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "How we protect data",
    body: (
      <>
        <ul>
          <li>Encrypted connections (HTTPS/TLS) for all traffic, including the connection to the database.</li>
          <li>Passwords hashed with Argon2id, with account lockouts and rate limits against guessing.</li>
          <li>Short-lived access tokens, rotating refresh tokens, and the option to sign out other devices.</li>
          <li>Each company&apos;s data is separated on every request and protected by database-level row security.</li>
          <li>Private file storage. Uploads are checked by their content and opened only after a permission check.</li>
          <li>An append-only audit log that can&apos;t be edited.</li>
        </ul>
        <p>
          No system is completely secure. If a personal data breach affects you, we will inform the affected customers and, where the law
          requires, the Data Protection Board of India. You can help by keeping your password private, using one you don&apos;t use elsewhere,
          and logging out of shared devices.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the DPDP Act and other applicable law, you can:</p>
        <ul>
          <li>ask for a summary of the personal data we process about you and how we process it;</li>
          <li>
            have it corrected, completed or updated (you can change your own name and email in <strong>Settings → Profile</strong>);
          </li>
          <li>have it erased when it&apos;s no longer needed, unless we must keep it by law;</li>
          <li>withdraw consent where we rely on it;</li>
          <li>nominate someone to exercise these rights for you in the event of death or incapacity; and</li>
          <li>
            raise a grievance with us (see <a href="#contact">Contact</a>) and, if you&apos;re not satisfied with our response, complain to the
            Data Protection Board of India.
          </li>
        </ul>
        <p>
          If your account was created by your company, your company controls the records about you. We will pass your request to it, or ask
          you to contact it, and help it respond. We may need to confirm your identity before acting on a request.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Kosh is a business tool for people aged 18 and over. We don&apos;t knowingly collect personal data from children. If you believe a
        child has given us personal data, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy as the Service or the law changes. We will change the date at the top of this page, and for significant
        changes we will tell account owners by email or in the app before the changes take effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact and grievances",
    body: (
      <p>
        For privacy questions, requests or complaints, <ContactLine />. Please mention your company code and what you need. We will
        acknowledge your request and respond within the time the law allows.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy policy"
      intro={
        <p>
          This policy explains what information Kosh collects, why, how it&apos;s protected and the choices you have. In short: we collect what
          is needed to run petty cash for your company, we don&apos;t sell it or use it for advertising, and your company stays in control of
          the records it keeps in Kosh.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
