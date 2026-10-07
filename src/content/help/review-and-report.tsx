import { DocTable, HelpLink, MenuPath, Note } from "@/components/marketing/doc-parts";
import type { HelpArticle } from "./types";

export const approvalArticles: HelpArticle[] = [
  {
    slug: "approval-workflow",
    category: "approvals",
    title: "How approvals work",
    description: "Submit, verify, approve or reject: the approval steps, who can review what, notifications, and switching approvals off.",
    Body: () => (
      <>
        <p>
          Approvals make sure a second person checks every expense before it counts. The cash balance changes only when an entry is approved.
        </p>

        <h2>The steps</h2>
        <ol>
          <li>
            <strong>Draft:</strong> the entry is saved but not sent.
          </li>
          <li>
            <strong>Submitted:</strong> the entry is waiting for review.
          </li>
          <li>
            <strong>Verified</strong> (optional): someone has checked the details, and the entry shows as <strong>Pending approval</strong>.
          </li>
          <li>
            <strong>Approved:</strong> the amount is added to or taken from the cash account, and the entry is locked.
          </li>
        </ol>
        <p>
          At the submitted or pending stage, a reviewer can instead <strong>reject</strong> the entry with a reason. The creator fixes it and
          submits it again. Verification is optional: an approver can approve a submitted entry directly.
        </p>

        <h2>Who can review</h2>
        <DocTable>
          <thead>
            <tr>
              <th>Action</th>
              <th>Permission needed</th>
              <th>Included by default in</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Verify</td>
              <td>Verify entries</td>
              <td>Owner, Admin, Accountant</td>
            </tr>
            <tr>
              <td>Approve</td>
              <td>Approve entries</td>
              <td>Owner, Admin, Accountant</td>
            </tr>
            <tr>
              <td>Reject</td>
              <td>Reject entries</td>
              <td>Owner, Admin, Accountant</td>
            </tr>
          </tbody>
        </DocTable>
        <Note title="Nobody reviews their own entry">
          You can&apos;t verify, approve or reject an entry you created; your own entries show <strong>Awaiting another reviewer</strong>. The
          company owner is the only exception, so a one-person business can still approve its entries.
        </Note>

        <h2>The Approvals page</h2>
        <p>
          <strong>Approvals</strong> lists everything waiting, oldest first, in two tabs: <strong>Needs your review</strong> and{" "}
          <strong>All pending</strong>. Each card shows the amount, description, category, who created it, the date, the payment method and any
          attachments, so you can usually decide without opening the entry.
        </p>
        <ul>
          <li>
            <strong>Approve</strong> asks you to confirm, and tells you how much will be deducted from which cash account.
          </li>
          <li>
            <strong>Reject</strong> needs a reason (3 to 500 characters). The creator sees it on the entry and in their notification.
          </li>
          <li>People who can verify entries can also correct small mistakes before approving.</li>
        </ul>

        <h2>Notifications</h2>
        <p>The bell icon shows in-app notifications, and refreshes every minute.</p>
        <ul>
          <li>When an entry is submitted, people who can verify or approve are notified.</li>
          <li>When an entry is verified, people who can approve are notified.</li>
          <li>When an entry is approved or rejected, the person who created it is notified, with the reason for a rejection.</li>
        </ul>
        <p>You aren&apos;t notified about your own actions.</p>

        <h2>Cancelling an entry</h2>
        <p>
          The creator, or someone who can verify entries, can cancel an entry any time before it&apos;s approved. Cancelled entries stay in the
          history but never affect the balance.
        </p>

        <h2>Switching approvals off</h2>
        <p>
          If you don&apos;t need a second check, turn off <strong>Approval required</strong> in <MenuPath>Settings → Company</MenuPath>. Submitted
          entries are then approved immediately and nobody is notified. You can switch it back on at any time.
        </p>
      </>
    ),
  },
];

export const reportArticles: HelpArticle[] = [
  {
    slug: "dashboard-and-reports",
    category: "reports",
    title: "Dashboard and reports",
    description: "Read your cash balance and dashboard, run the eight reports, choose date ranges, and export to CSV, Excel or PDF.",
    Body: () => (
      <>
        <h2>The dashboard</h2>
        <ul>
          <li>
            <strong>Current cash balance</strong> counts approved entries only. With several cash accounts, it shows each one.
          </li>
          <li>
            <strong>Tiles</strong> show today&apos;s expenses, this month&apos;s total, entries waiting for approval, and the number of
            transactions and active users.
          </li>
          <li>
            <strong>Charts</strong> show the expense trend for the last 30 days, spending by category, the last six months side by side, and
            payment methods.
          </li>
          <li>The latest 8 transactions are listed at the bottom.</li>
        </ul>

        <h2>How the balance is worked out</h2>
        <p>
          <strong>Balance = opening balance + approved cash added − approved expenses ± approved adjustments.</strong> Drafts, entries waiting
          for approval, rejected and cancelled entries are not counted. If the balance doesn&apos;t match the cash in the box, check the
          Approvals page for entries still waiting, then record an adjustment for any real difference.
        </p>

        <h2>Reports</h2>
        <p>
          The <strong>Reports</strong> page has eight reports:
        </p>
        <DocTable>
          <thead>
            <tr>
              <th>Report</th>
              <th>Shows</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Daily, Weekly, Monthly</td>
              <td>Spending over time.</td>
            </tr>
            <tr>
              <td>By category</td>
              <td>Where the money went.</td>
            </tr>
            <tr>
              <td>By user</td>
              <td>Who spent it.</td>
            </tr>
            <tr>
              <td>By payment method</td>
              <td>Cash, UPI, card, bank transfer and other.</td>
            </tr>
            <tr>
              <td>Cash accounts</td>
              <td>Money in and out of each cash account (needs permission to view cash accounts).</td>
            </tr>
            <tr>
              <td>Approvals</td>
              <td>How many entries were submitted, approved and rejected.</td>
            </tr>
          </tbody>
        </DocTable>

        <h3>Date range and filters</h3>
        <ul>
          <li>
            Choose <strong>This month</strong> (the default), <strong>Last month</strong>, <strong>Last 30 days</strong>,{" "}
            <strong>This quarter</strong> or <strong>This financial year</strong>, or a custom range of up to three years.
          </li>
          <li>
            Show <strong>Approved only</strong>, or <strong>All recorded</strong> to include entries still waiting for approval.
          </li>
          <li>Narrow the report by category, user, payment method or cash account.</li>
        </ul>
        <p>
          The financial year follows your company setting (April to March unless you change it in{" "}
          <MenuPath>Settings → Company</MenuPath>).
        </p>

        <h2>Exporting</h2>
        <p>
          Choose <strong>Export</strong> and pick <strong>CSV</strong>, <strong>Excel</strong> or <strong>PDF</strong>. The file matches what&apos;s
          on screen. Viewing reports needs the <strong>View reports</strong> permission; exporting needs <strong>Export reports</strong>, which
          Owners, Admins and Accountants have by default. To export the individual entries rather than totals, use the Transactions page; see{" "}
          <HelpLink slug="find-entries">Find, filter and export entries</HelpLink>.
        </p>
      </>
    ),
  },
];
