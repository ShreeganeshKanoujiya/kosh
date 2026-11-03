import Link from "next/link";
import { ContactLine, HelpLink, MenuPath, Note } from "@/components/marketing/doc-parts";
import type { HelpArticle } from "./types";

export const accountArticles: HelpArticle[] = [
  {
    slug: "passwords-and-sessions",
    category: "account",
    updated: "2026-10-07",
    title: "Passwords, sessions and security",
    description: "Change your password, see where you're signed in, sign out other devices, and review your login history.",
    Body: () => (
      <>
        <h2>Password rules</h2>
        <ul>
          <li>At least 10 characters (up to 128).</li>
          <li>At least three of: lowercase letters, capital letters, numbers and symbols.</li>
          <li>Not a common password, and not containing your username.</li>
        </ul>
        <p>A short sentence you&apos;ll remember, such as &quot;Chai at 4, every day!&quot;, is both strong and easy to type.</p>

        <h2>Change your password</h2>
        <p>
          Open <MenuPath>Settings → Security</MenuPath>, enter your current password and the new one twice. You stay signed in on this device;
          every other device is signed out.
        </p>

        <h2>Where you&apos;re signed in</h2>
        <p>
          <MenuPath>Settings → Security</MenuPath> lists your active sessions with the device, IP address, when each was last active and when it
          signed in. The one you&apos;re using is marked <strong>This device</strong>. Choose <strong>Sign out</strong> next to any session you
          don&apos;t recognise, then change your password.
        </p>

        <h2>Login history</h2>
        <p>
          The same page shows your last 20 login attempts, including failed ones and why they failed. Failed attempts you didn&apos;t make are a
          sign someone is guessing your password: change it.
        </p>

        <h2>Log out everywhere</h2>
        <p>
          <strong>Log out of all devices</strong> (in the account menu, or under <strong>More</strong> on a phone) ends every session, including
          this one.
        </p>

        <h2>If an admin resets your password</h2>
        <p>
          An admin can set a new password for you from the Users page. You&apos;ll be signed out everywhere; log in with the password they give
          you, then change it in <MenuPath>Settings → Security</MenuPath>.
        </p>

        <Note tone="tip" title="Keep your account safe">
          Use a password you don&apos;t use anywhere else, untick <strong>Remember company code</strong> on shared computers, and log out when
          you&apos;re done on a device that isn&apos;t yours.
        </Note>
      </>
    ),
  },
  {
    slug: "troubleshooting",
    category: "account",
    updated: "2026-10-07",
    title: "Troubleshooting",
    description: "Fixes for the most common problems: logging in, scans, approvals, uploads, exports and unexpected sign-outs.",
    Body: () => (
      <>
        <h2>I can&apos;t log in</h2>
        <ul>
          <li>Check the company code: it&apos;s 6 letters and numbers. Ask a colleague, who can see it in their account menu.</li>
          <li>Usernames are lowercase. Passwords are case-sensitive.</li>
          <li>
            &quot;Too many failed attempts&quot;: wait 15 minutes, or <Link href="/forgot-password">reset your password</Link>.
          </li>
          <li>&quot;Your account has been disabled&quot;: ask your company&apos;s owner or admin to enable it.</li>
        </ul>

        <h2>I didn&apos;t get the password-reset email</h2>
        <p>
          Check your spam folder and wait a few minutes. The email is only sent if your account has an email address; if it doesn&apos;t, ask an
          admin to reset your password from the Users page. Links expire after 30 minutes, and requesting a new one cancels the old one.
        </p>

        <h2>The scan read something wrong</h2>
        <p>
          Correct the value in the form before saving: the screenshot stays beside the form for comparison. Values below 80% confidence are
          highlighted. For better results, use the original screenshot rather than a forwarded or cropped image. See{" "}
          <HelpLink slug="scan-upi-screenshots">Scan a UPI screenshot</HelpLink>.
        </p>

        <h2>I can&apos;t approve an entry</h2>
        <ul>
          <li>
            It&apos;s your own entry. Another reviewer must approve it (<strong>Awaiting another reviewer</strong>).
          </li>
          <li>Your role doesn&apos;t include the approve permission. Ask an admin.</li>
          <li>It&apos;s already approved, rejected or cancelled.</li>
        </ul>

        <h2>I can&apos;t edit an entry</h2>
        <p>
          Approved entries are locked. Your own entries can be edited while they&apos;re drafts or rejected; once submitted, only someone who
          can verify entries can change them. See <HelpLink slug="record-an-expense">Record an expense</HelpLink>.
        </p>

        <h2>&quot;Attach a receipt before submitting&quot;</h2>
        <p>Your company requires a receipt on every expense. Attach one, or save a draft and add it later.</p>

        <h2>&quot;Exceeds the company&apos;s per-expense limit&quot;</h2>
        <p>The amount is above your company&apos;s maximum per expense. Use your regular purchase process, or ask an admin about the limit.</p>

        <h2>My file won&apos;t upload</h2>
        <p>
          Files must be JPG, PNG, WebP or PDF, up to 4 MB, with at most 10 per entry. Save large PDFs at a smaller size, or attach only the
          pages you need.
        </p>

        <h2>There&apos;s no Export button</h2>
        <p>Exporting needs the Export reports permission. Ask an admin to add it to your role.</p>

        <h2>I was logged out unexpectedly</h2>
        <p>
          You may have been signed out by a password change or reset, by an admin, or by <strong>Log out of all devices</strong> on another
          device. Sessions also end after about a week without use. Log in again; if it keeps happening, check your sessions and login history
          in <MenuPath>Settings → Security</MenuPath>.
        </p>

        <h2>The balance doesn&apos;t match the cash box</h2>
        <p>
          Only approved entries count. Check the Approvals page for entries still waiting, make sure the opening balance in{" "}
          <MenuPath>Settings → Cash accounts</MenuPath> is right, then record an adjustment for any real difference.
        </p>

        <h2>Still stuck?</h2>
        <p>
          Read the <Link href="/faq">FAQ</Link>, or <ContactLine />.
        </p>
      </>
    ),
  },
];
