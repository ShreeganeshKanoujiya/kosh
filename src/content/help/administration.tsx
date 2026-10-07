import { DocTable, HelpLink, MenuPath, Note } from "@/components/marketing/doc-parts";
import type { HelpArticle } from "./types";

export const administrationArticles: HelpArticle[] = [
  {
    slug: "users-and-roles",
    category: "administration",
    title: "Users and roles",
    description: "Add people to your company, choose their roles, reset passwords, disable or remove accounts, and build custom roles.",
    Body: () => (
      <>
        <h2>The built-in roles</h2>
        <DocTable>
          <thead>
            <tr>
              <th>Role</th>
              <th>Typical person</th>
              <th>Can do</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Owner</td>
              <td>Business owner</td>
              <td>Everything. There is one owner per company, created at sign-up.</td>
            </tr>
            <tr>
              <td>Admin</td>
              <td>Office manager</td>
              <td>Everything except changing the company profile: users, roles, entries, categories, cash accounts, settings and reports.</td>
            </tr>
            <tr>
              <td>Accountant</td>
              <td>Accounts team</td>
              <td>Record, verify, approve and reject entries; manage categories; view and export reports; see the audit log.</td>
            </tr>
            <tr>
              <td>Cashier</td>
              <td>Person holding the cash</td>
              <td>Record entries and follow them through approval; view categories, cash accounts and reports.</td>
            </tr>
            <tr>
              <td>Viewer</td>
              <td>Partner, auditor</td>
              <td>Read-only access to entries, categories, cash accounts and reports.</td>
            </tr>
          </tbody>
        </DocTable>

        <h2>Add a user</h2>
        <ol>
          <li>
            Open <strong>Users</strong> and choose <strong>Add user</strong>.
          </li>
          <li>
            Enter their full name, username and, optionally, an email address. Without an email they can&apos;t reset a forgotten password
            themselves.
          </li>
          <li>Pick a role.</li>
          <li>
            Type a temporary password or use <strong>Generate</strong>, then save.
          </li>
          <li>Give them the company code, their username and the temporary password.</li>
        </ol>

        <h2>Manage a user</h2>
        <p>Open the menu next to a user to:</p>
        <ul>
          <li>
            <strong>Edit details &amp; role</strong>.
          </li>
          <li>
            <strong>Reset password:</strong> Kosh suggests a strong 12-character password you can copy. The user is signed out on every device.
          </li>
          <li>
            <strong>Sign out all sessions</strong>, for example after a lost phone.
          </li>
          <li>
            <strong>Disable</strong> the account, which signs them out immediately and blocks logging in, or <strong>Enable</strong> it again.
          </li>
          <li>
            <strong>Delete</strong> the user. Their past entries are kept, and their username stays reserved so the history remains clear.
          </li>
        </ul>
        <Note title="Built-in protections">
          Nobody can change their own role, disable or delete themselves. The owner&apos;s role and status can&apos;t be changed, only the owner
          can edit or reset the owner&apos;s account, and the Owner role can&apos;t be given to anyone else. You can only assign roles whose
          permissions you have yourself.
        </Note>

        <h2>Custom roles</h2>
        <p>
          If the built-in roles don&apos;t fit, open <MenuPath>Settings → Roles &amp; permissions</MenuPath> and create a role with a name, an
          optional description and the permissions it needs. For example, a &quot;Site supervisor&quot; who can record and verify entries but
          not approve them.
        </p>
        <ul>
          <li>You can only grant permissions you have yourself.</li>
          <li>Built-in roles can&apos;t be edited or deleted. Create a custom role instead.</li>
          <li>A role can&apos;t be deleted while people are assigned to it.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "categories-and-cash-accounts",
    category: "administration",
    title: "Categories and cash accounts",
    description: "Organise spending with categories, and track one or more cash boxes with their own opening and current balances.",
    Body: () => (
      <>
        <h2>Categories</h2>
        <p>
          Categories describe what money was spent on, and drive the &quot;By category&quot; report. New companies start with Office Supplies,
          Travel, Refreshments, Postage &amp; Courier, Repairs &amp; Maintenance, Cleaning, Utilities and Miscellaneous.
        </p>
        <ul>
          <li>
            Add, rename or edit categories on the <strong>Categories</strong> page.
          </li>
          <li>
            <strong>Deactivate</strong> a category you no longer use. It disappears from the entry form but stays on past entries and in
            reports. You can reactivate it later.
          </li>
          <li>
            <strong>Delete</strong> is offered only for categories that have never been used.
          </li>
        </ul>

        <h2>Cash accounts</h2>
        <p>
          A cash account is a cash box or float with its own balance: the office box, a site float, a branch. New companies have one, called{" "}
          <strong>Main Cash</strong>, which is the default. Manage them in <MenuPath>Settings → Cash accounts</MenuPath>.
        </p>
        <ul>
          <li>
            Set the <strong>opening balance</strong> to the cash you started with. Changing it later recalculates the current balance.
          </li>
          <li>When there&apos;s more than one account, the entry form asks which account each entry belongs to.</li>
          <li>
            Accounts can be deactivated but not deleted, so their history is never lost. The default account can&apos;t be deactivated; choose a
            different default in <MenuPath>Settings → Company</MenuPath> first.
          </li>
        </ul>
        <p>
          The current balance is the opening balance plus approved cash added, minus approved expenses, plus or minus approved adjustments. See{" "}
          <HelpLink slug="dashboard-and-reports">Dashboard and reports</HelpLink>.
        </p>
      </>
    ),
  },
  {
    slug: "company-settings",
    category: "administration",
    title: "Company settings",
    description: "Currency, timezone, financial year, default cash account, approvals, receipt rules and a per-expense limit.",
    Body: () => (
      <>
        <p>
          Open <MenuPath>Settings → Company</MenuPath>. Everyone who can view company settings sees this page; Owners and Admins can change it.
        </p>
        <DocTable>
          <thead>
            <tr>
              <th>Setting</th>
              <th>What it does</th>
              <th>New companies</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Company name</td>
              <td>Shown across the app and on exports. Only the owner can change it.</td>
              <td>From sign-up</td>
            </tr>
            <tr>
              <td>Currency</td>
              <td>The currency amounts are shown in: INR, USD, EUR, GBP, AED or SGD.</td>
              <td>INR (₹)</td>
            </tr>
            <tr>
              <td>Timezone</td>
              <td>Decides what &quot;today&quot; and &quot;this month&quot; mean, and the year in entry numbers.</td>
              <td>Asia/Kolkata</td>
            </tr>
            <tr>
              <td>Financial year starts</td>
              <td>The month used for &quot;This financial year&quot; in reports.</td>
              <td>April</td>
            </tr>
            <tr>
              <td>Default cash account</td>
              <td>The account new entries use unless someone picks another.</td>
              <td>Main Cash</td>
            </tr>
            <tr>
              <td>Approval required</td>
              <td>
                When on, entries wait for a reviewer before they change the balance. When off, submitting approves straight away.
              </td>
              <td>On</td>
            </tr>
            <tr>
              <td>Receipt required</td>
              <td>When on, expenses can&apos;t be submitted without an attached receipt or screenshot.</td>
              <td>Off</td>
            </tr>
            <tr>
              <td>Maximum per expense</td>
              <td>Expenses above this amount are refused. Leave it empty for no limit.</td>
              <td>No limit</td>
            </tr>
          </tbody>
        </DocTable>
        <p>Every change to these settings is recorded in the audit log.</p>
      </>
    ),
  },
  {
    slug: "audit-log",
    category: "administration",
    title: "The audit log",
    description: "A permanent record of who did what and when: sign-ins, changes to entries, users and settings, uploads and exports.",
    Body: () => (
      <>
        <p>
          The audit log is in <MenuPath>Settings → Audit log</MenuPath>. Owners, Admins and Accountants can see it by default.
        </p>

        <h2>What&apos;s recorded</h2>
        <ul>
          <li>Logins, logouts, password changes and session events.</li>
          <li>Every action on an entry: created, edited, submitted, verified, approved, rejected, cancelled and deleted.</li>
          <li>Changes to users, roles, categories, cash accounts and company settings.</li>
          <li>File uploads and exports.</li>
        </ul>
        <p>
          Each row shows who did it, when, from which IP address and device, and what changed from the old value to the new one.
        </p>

        <h2>Finding something</h2>
        <p>Filter by area and by a date range. Results show 30 at a time.</p>

        <Note title="It can't be edited">
          The audit log is append-only: entries can&apos;t be changed or removed, even by the owner. That&apos;s what makes it useful to
          auditors.
        </Note>
      </>
    ),
  },
];
