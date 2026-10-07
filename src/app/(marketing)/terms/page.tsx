import Link from "next/link";
import { ContactLine } from "@/components/marketing/doc-parts";
import { LegalDocument, type LegalSection } from "@/components/marketing/legal-document";
import { SITE } from "@/config/site";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Terms and conditions",
  description:
    "The terms for using Kosh: accounts and the company code, who owns your data, acceptable use, fees, availability, liability and governing law.",
  path: "/terms",
});

const SECTIONS: LegalSection[] = [
  {
    id: "about-these-terms",
    title: "About these terms",
    body: (
      <>
        <p>
          These terms are an agreement between you and Kosh (&quot;we&quot;, &quot;us&quot;) for the use of the Kosh website and web
          application at {SITE.url} (the &quot;Service&quot;).
        </p>
        <ul>
          <li>
            <strong>&quot;Your company&quot;</strong> is the business that registered on Kosh; <strong>&quot;users&quot;</strong> are the people
            with accounts in it.
          </li>
          <li>
            <strong>&quot;Customer data&quot;</strong> is everything your company and its users put into Kosh: records, attachments, user details
            and settings.
          </li>
          <li>
            If you register on behalf of a business, you confirm that you are authorised to accept these terms for it, and &quot;you&quot;
            includes that business.
          </li>
        </ul>
        <p>
          Our <Link href="/privacy">Privacy policy</Link> explains how we handle personal data and forms part of these terms.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who can use Kosh",
    body: (
      <p>
        You must be at least 18 years old and able to enter into a binding contract under Indian law. Kosh is meant for business use, to keep a
        company&apos;s petty cash records.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Accounts and the company code",
    body: (
      <ul>
        <li>
          Registering creates a company and an Owner account. The owner, and anyone the owner allows, adds users and chooses their roles. Your
          company is responsible for who it gives access to and for what its users do in Kosh.
        </li>
        <li>
          Keep usernames, passwords and the company code confidential. Don&apos;t share accounts: each person needs their own, so the audit
          trail shows who did what.
        </li>
        <li>
          If you suspect someone has accessed an account without permission, change the password, sign out other sessions in{" "}
          <strong>Settings → Security</strong>, and tell us.
        </li>
        <li>Give accurate information, and keep the owner&apos;s email address up to date so we can reach your company.</li>
      </ul>
    ),
  },
  {
    id: "your-data",
    title: "Your data",
    body: (
      <ul>
        <li>
          Your company owns its customer data. You give us permission to host, copy, process and display it only as needed to provide, secure
          and support the Service, and as described in the Privacy policy.
        </li>
        <li>
          You are responsible for your customer data: that it is accurate and lawful, and that you have the right to upload it, including
          personal data about employees, vendors or others that appears in screenshots and receipts. You are also responsible for giving any
          notices and obtaining any consents the law requires for that.
        </li>
        <li>
          You can export your records to CSV, Excel or PDF at any time while your account is active. Keep your own copies: Kosh is a tool for
          managing petty cash and does not replace the books of account your company must maintain.
        </li>
      </ul>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>
            use Kosh for anything unlawful, fraudulent or misleading, including recording false or inflated expenses or altering records to
            mislead auditors, tax authorities or anyone else;
          </li>
          <li>upload malware, or content you don&apos;t have the right to share;</li>
          <li>
            try to access another company&apos;s data or another person&apos;s account, or probe, scan or test the Service for vulnerabilities
            without our written permission;
          </li>
          <li>interfere with or overload the Service, get around rate limits or other protections, or scrape it with automated tools;</li>
          <li>copy, resell, sublicense or reverse-engineer the Service, except where the law allows it; or</li>
          <li>use the Service to build a competing product.</li>
        </ul>
      </>
    ),
  },
  {
    id: "automated-features",
    title: "Scanning and automated features",
    body: (
      <p>
        Screenshot reading, duplicate warnings, balances and reports are there to help, not to replace human checks. Text recognition can
        misread an amount, date or reference. Check every value before you save or approve an entry: your company is responsible for the
        records it saves and approves.
      </p>
    ),
  },
  {
    id: "not-a-financial-service",
    title: "Not a payment or advisory service",
    body: (
      <p>
        Kosh does not hold, send or receive money. It is not a bank, payment system or payment aggregator, and it is not connected to UPI apps
        or bank accounts. Kosh does not provide accounting, tax or legal advice; your company remains responsible for its accounts, tax and GST
        filings, and compliance with the law.
      </p>
    ),
  },
  {
    id: "fees",
    title: "Fees",
    body: (
      <p>
        If we charge for the Service or any part of it, we will show the price and payment terms before you are asked to pay. We will give an
        existing company at least 30 days&apos; notice before introducing or changing fees that apply to it. Unless stated otherwise, fees
        exclude applicable taxes.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes to the Service",
    body: (
      <p>
        We work to keep Kosh available, accurate and secure, but we can&apos;t promise that it will be uninterrupted or error-free. It may be
        unavailable during maintenance or because of events outside our control. We may add, change or remove features; if a change
        significantly reduces what the Service does for you, we will try to tell you in advance.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: (
      <ul>
        <li>
          You can stop using Kosh at any time. Your company&apos;s owner can ask us to close the company&apos;s account (see{" "}
          <Link href="/faq#close-account">how to close an account</Link>).
        </li>
        <li>
          We may suspend or end access if these terms are broken, if the law requires it, or to protect the Service or other people. Where it
          is reasonable to do so, we will give notice first and a chance to export your data.
        </li>
        <li>
          After an account is closed, customer data is deleted as described in the Privacy policy. Sections of these terms that by their nature
          should continue, such as data ownership, disclaimers, limitation of liability, indemnity and governing law, continue to apply.
        </li>
      </ul>
    ),
  },
  {
    id: "intellectual-property",
    title: "Intellectual property",
    body: (
      <p>
        The Service, its software and design, and the Kosh name and logo belong to Kosh or its licensors. These terms give you the
        right to use the Service as described here and no other rights. If you send us feedback or suggestions, we may use them without any
        obligation to you.
      </p>
    ),
  },
  {
    id: "disclaimers",
    title: "Disclaimers",
    body: (
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot;. To the extent the law allows, we disclaim all implied
        warranties, including those of merchantability, fitness for a particular purpose and non-infringement.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <ul>
        <li>
          To the extent the law allows, we are not liable for indirect, incidental, special, consequential or punitive losses, or for loss of
          profits, revenue, data or goodwill.
        </li>
        <li>
          Our total liability for all claims relating to the Service is limited to the greater of the amount you paid us for the Service in the
          12 months before the event giving rise to the claim, and ₹1,000.
        </li>
        <li>Nothing in these terms limits liability that cannot be limited by law, such as liability for fraud.</li>
      </ul>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: (
      <p>
        You agree to compensate us for losses and reasonable costs arising from third-party claims that result from your customer data, or from
        your breach of these terms or of the law.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law and disputes",
    body: (
      <p>
        These terms are governed by the laws of India. If a dispute arises, please contact us first so we can try to resolve it informally. If
        it isn&apos;t resolved within 30 days, the courts in India that have jurisdiction over our registered office will have exclusive
        jurisdiction.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. We will change the date at the top of this page, and for significant changes we will tell account owners by
        email or in the app at least 15 days before they take effect. If you keep using Kosh after that, you accept the updated terms.
      </p>
    ),
  },
  {
    id: "general",
    title: "General",
    body: (
      <ul>
        <li>These terms and the Privacy policy are the whole agreement between you and us about the Service.</li>
        <li>If any part of these terms can&apos;t be enforced, the rest still applies.</li>
        <li>If we don&apos;t enforce a right straight away, we haven&apos;t given it up.</li>
        <li>
          You may not transfer your rights under these terms without our consent. We may transfer ours as part of a merger, acquisition or sale
          of assets.
        </li>
        <li>Neither of us is responsible for delays or failures caused by events beyond reasonable control.</li>
      </ul>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        If you have questions about these terms, <ContactLine />.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalDocument
      title="Terms and conditions"
      intro={
        <p>
          Please read these terms before using Kosh. By creating a company, or by using an account someone created for you, you agree to them.
          If you don&apos;t agree, please don&apos;t use the Service.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
