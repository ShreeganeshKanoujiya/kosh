import Link from "next/link";
import { HelpLink, MenuPath, Note } from "@/components/marketing/doc-parts";
import type { HelpArticle } from "./types";

export const gettingStartedArticles: HelpArticle[] = [
  {
    slug: "getting-started",
    category: "getting-started",
    updated: "2026-10-07",
    title: "Set up your company",
    description: "Create your company, save the company code, check your settings and invite your team — in about ten minutes.",
    Body: () => (
      <>
        <p>This guide takes you from signing up to your team&apos;s first approved expense.</p>

        <h2>1. Create your company</h2>
        <ol>
          <li>
            Open <Link href="/register">Create your company</Link>.
          </li>
          <li>
            Enter the company name, your full name and your email address. The email is used only for password-reset links.
          </li>
          <li>
            Choose a username (3–32 characters: lowercase letters, numbers, dots, underscores or hyphens) and a password. Your username
            can&apos;t be changed later.
          </li>
          <li>
            Choose <strong>Create company</strong>. You become the company&apos;s <strong>Owner</strong>.
          </li>
        </ol>
        <p>
          Passwords need at least 10 characters and at least three of: lowercase letters, capital letters, numbers and symbols. Common
          passwords and passwords that contain your username are refused.
        </p>

        <h2>2. Save your company code</h2>
        <p>
          Kosh then shows your <strong>company code</strong>: 6 letters and numbers that identify your company. Everyone in your company logs
          in with this code plus their own username and password.
        </p>
        <p>
          Use <strong>Copy code</strong> or <strong>Save as file</strong>, tick <strong>I&apos;ve saved my company code</strong>, then choose{" "}
          <strong>Continue to dashboard</strong>.
        </p>
        <Note tone="tip" title="Lost the code later?">
          It&apos;s always shown in the account menu (your avatar) on a computer, and under <strong>More</strong> on a phone.
        </Note>

        <h2>3. Check your company settings</h2>
        <p>
          New companies start with Indian rupees, the Asia/Kolkata timezone, an April–March financial year and approvals switched on. To change
          any of these, open <MenuPath>Settings → Company</MenuPath>. See <HelpLink slug="company-settings">Company settings</HelpLink> for what
          each option does.
        </p>

        <h2>4. Set your opening cash balance</h2>
        <p>
          Kosh creates a cash account called <strong>Main Cash</strong>. Count the cash in the box, then open{" "}
          <MenuPath>Settings → Cash accounts</MenuPath> and enter it as the opening balance. If you keep several cash boxes, add an account for
          each. See <HelpLink slug="categories-and-cash-accounts">Categories and cash accounts</HelpLink>.
        </p>

        <h2>5. Review your categories</h2>
        <p>
          Eight categories are ready to use: Office Supplies, Travel, Refreshments, Postage &amp; Courier, Repairs &amp; Maintenance, Cleaning,
          Utilities and Miscellaneous. Rename them or add your own on the <strong>Categories</strong> page.
        </p>

        <h2>6. Add your team</h2>
        <ol>
          <li>
            Open <strong>Users</strong> and choose <strong>Add user</strong>.
          </li>
          <li>Enter their full name, a username, an email (optional, but needed for them to reset their own password) and a role.</li>
          <li>
            Set a temporary password, or use <strong>Generate</strong> to create one.
          </li>
          <li>Share the company code, their username and the temporary password with them. They can change the password after logging in.</li>
        </ol>
        <p>
          Not sure which role to give? See <HelpLink slug="users-and-roles">Users and roles</HelpLink>. A typical setup is a Cashier for the
          person holding the cash and an Accountant to approve.
        </p>

        <h2>7. Record your first expense</h2>
        <p>
          Choose <strong>Add transaction</strong> (or <strong>+</strong> on a phone) and pick <strong>Scan UPI screenshot</strong>,{" "}
          <strong>Manual entry</strong> or <strong>Upload receipt</strong>. See <HelpLink slug="record-an-expense">Record an expense</HelpLink>.
        </p>
        <Note title="Running the business on your own?">
          Nobody can approve their own entries, except the owner. So a one-person company still works: approve your own entries, or switch
          approvals off in <MenuPath>Settings → Company</MenuPath>.
        </Note>
      </>
    ),
  },
  {
    slug: "logging-in",
    category: "getting-started",
    updated: "2026-10-07",
    title: "Log in and stay signed in",
    description: "Logging in with your company code, resetting a forgotten password, account lockouts, and how long you stay signed in.",
    Body: () => (
      <>
        <h2>Logging in</h2>
        <p>
          On the <Link href="/login">login page</Link>, enter your <strong>company code</strong>, your <strong>username</strong> and your{" "}
          <strong>password</strong>. Your username only needs to be unique inside your company, which is why the company code is needed too.
        </p>
        <p>
          <strong>Remember company code on this device</strong> is ticked by default, so next time you only type your username and password.
          Untick it on a shared or public computer.
        </p>

        <h2>Forgot your password?</h2>
        <ol>
          <li>
            Choose <strong>Forgot password?</strong> on the login page.
          </li>
          <li>Enter your company code and username.</li>
          <li>If your account has an email address, you&apos;ll receive a reset link. It works once and expires after 30 minutes.</li>
          <li>Choose a new password. You&apos;ll be signed out on every device, then you can log in with the new password.</li>
        </ol>
        <p>
          Asking for a new link cancels any older ones. If your account has no email address, ask your company&apos;s owner or an admin to reset
          your password from the <strong>Users</strong> page.
        </p>

        <h2>&quot;Too many failed attempts&quot;</h2>
        <p>
          After 5 wrong passwords for the same username within 15 minutes, Kosh blocks further attempts for 15 minutes. This protects your
          account from guessing. Wait and try again, or reset your password.
        </p>

        <h2>&quot;Your account has been disabled&quot;</h2>
        <p>An admin has switched your account off. Ask your company&apos;s owner or admin to enable it again.</p>

        <h2>How long you stay signed in</h2>
        <p>
          Kosh keeps you signed in while you use it. With the standard settings, you&apos;ll be asked to log in again after about a week without
          using Kosh on that device, and at least once every 30 days.
        </p>
        <p>
          To sign out, open the account menu (or <strong>More</strong> on a phone) and choose <strong>Log out</strong>, or{" "}
          <strong>Log out of all devices</strong> to end every session at once.
        </p>
      </>
    ),
  },
  {
    slug: "using-kosh-on-your-phone",
    category: "getting-started",
    updated: "2026-10-07",
    title: "Use Kosh on your phone",
    description: "Add Kosh to your home screen, find your way around the tab bar, and record expenses quickly on the go.",
    Body: () => (
      <>
        <p>Kosh is designed for phones first. There&apos;s nothing to install from an app store: it runs in your phone&apos;s browser.</p>

        <h2>Add Kosh to your home screen</h2>
        <ul>
          <li>
            <strong>iPhone (Safari):</strong> open Kosh, tap the Share button, then <strong>Add to Home Screen</strong>.
          </li>
          <li>
            <strong>Android (Chrome):</strong> open Kosh, tap the ⋮ menu, then <strong>Add to home screen</strong> or{" "}
            <strong>Install app</strong>.
          </li>
        </ul>
        <p>Kosh then opens full-screen from its icon, like an app.</p>

        <h2>Getting around</h2>
        <ul>
          <li>
            The <strong>tab bar</strong> at the bottom holds your most-used pages, such as Home, Entries and Reports, depending on your role.
          </li>
          <li>
            The <strong>+</strong> button in the middle adds an entry: <strong>Scan UPI screenshot</strong>, <strong>Manual entry</strong> or{" "}
            <strong>Upload receipt</strong>.
          </li>
          <li>
            <strong>More</strong> shows your name, role and company code, the remaining pages, the light/dark theme switch, and Log out.
          </li>
          <li>The bell at the top shows notifications, such as an entry waiting for your approval or one that was rejected.</li>
        </ul>

        <h2>Shortcuts</h2>
        <ul>
          <li>
            In the entries list, <strong>swipe a row to the left</strong> to reveal <strong>Edit</strong>. It appears only on entries you can
            still change.
          </li>
          <li>
            Pay by UPI, take a screenshot of the success screen, then tap <strong>+</strong> → <strong>Scan UPI screenshot</strong>. Most details
            fill in by themselves. See <HelpLink slug="scan-upi-screenshots">Scan a UPI screenshot</HelpLink>.
          </li>
          <li>Photos of bills are resized on your phone before they upload, so they&apos;re quick even on mobile data.</li>
        </ul>
      </>
    ),
  },
];
