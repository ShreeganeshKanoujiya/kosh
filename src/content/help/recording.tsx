import { DocTable, HelpLink, MenuPath, Note } from "@/components/marketing/doc-parts";
import type { HelpArticle } from "./types";

export const recordingArticles: HelpArticle[] = [
  {
    slug: "record-an-expense",
    category: "recording",
    updated: "2026-10-07",
    title: "Record an expense",
    description: "Every field on the entry form, saving a draft or submitting for approval, duplicate warnings, and entry numbers.",
    Body: () => (
      <>
        <h2>Start a new entry</h2>
        <p>
          Choose <strong>Add transaction</strong> at the top of the page (on a phone, the <strong>+</strong> in the tab bar) and pick how you
          want to start:
        </p>
        <ul>
          <li>
            <strong>Scan UPI screenshot</strong> fills the form in from a payment screenshot. See{" "}
            <HelpLink slug="scan-upi-screenshots">Scan a UPI screenshot</HelpLink>.
          </li>
          <li>
            <strong>Manual entry</strong> opens an empty form.
          </li>
          <li>
            <strong>Upload receipt</strong> starts with a photo or PDF of the bill attached.
          </li>
        </ul>

        <h2>The entry form</h2>
        <DocTable>
          <thead>
            <tr>
              <th>Field</th>
              <th>What to enter</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Type</td>
              <td>
                <strong>Expense</strong> for money spent, <strong>Cash added</strong> for money put into the cash box, or{" "}
                <strong>Adjustment</strong> to correct the balance (only people who can verify entries can make adjustments).
              </td>
            </tr>
            <tr>
              <td>Amount</td>
              <td>The amount paid. For an adjustment, also choose whether it increases or decreases the balance.</td>
            </tr>
            <tr>
              <td>Category</td>
              <td>What the money was spent on. Required for expenses.</td>
            </tr>
            <tr>
              <td>Paid by</td>
              <td>Cash, UPI, card, bank transfer or other.</td>
            </tr>
            <tr>
              <td>Date and time</td>
              <td>When the payment was made. The date can&apos;t be in the future.</td>
            </tr>
            <tr>
              <td>Description</td>
              <td>A short note, such as &quot;Printer paper for the front office&quot;.</td>
            </tr>
            <tr>
              <td>Receipt and attachments</td>
              <td>
                Photos or PDFs of the bill, invoice or screenshot. See <HelpLink slug="receipts-and-attachments">Receipts and attachments</HelpLink>.
              </td>
            </tr>
          </tbody>
        </DocTable>
        <p>
          Open <strong>More details</strong> for the merchant or payee, UPI ID, transaction ID (UTR), bill or reference number, and the cash
          account (shown only when your company has more than one).
        </p>

        <h2>Save a draft or submit</h2>
        <ul>
          <li>
            <strong>Save draft</strong> keeps the entry to finish later. Drafts don&apos;t affect the balance.
          </li>
          <li>
            <strong>Save &amp; submit</strong> sends the entry for approval. See <HelpLink slug="approval-workflow">How approvals work</HelpLink>.
          </li>
          <li>
            If your company has switched approvals off, the button says <strong>Save</strong> and the entry is approved straight away.
          </li>
        </ul>

        <h2>Company rules you might see</h2>
        <ul>
          <li>
            <strong>Receipt required:</strong> &quot;Attach a receipt before submitting — or save as a draft for now.&quot; Your company needs a
            receipt or screenshot on every expense.
          </li>
          <li>
            <strong>Limit per expense:</strong> the form shows your company&apos;s maximum. Larger expenses are refused and should go through your
            regular purchase process.
          </li>
        </ul>

        <h2>Duplicate warnings</h2>
        <p>
          Before saving, Kosh checks for an existing entry with the same UPI transaction ID, or the same amount, date and payee. If it finds
          one, you&apos;ll see <strong>Possible duplicate</strong> with three choices: <strong>Cancel</strong>, <strong>View existing</strong>{" "}
          or <strong>Save anyway</strong>. Cancelled and deleted entries are ignored.
        </p>

        <h2>Entry numbers</h2>
        <p>
          Every entry gets a number like <code>PC-2026-000042</code>: the year it was created and a counter that starts again each January.
          Search for the number on the Transactions page to find an entry quickly.
        </p>

        <h2>Changing an entry later</h2>
        <ul>
          <li>You can edit your own entries while they&apos;re drafts or after they&apos;ve been rejected.</li>
          <li>People who verify entries can also edit entries that are waiting for approval.</li>
          <li>Approved entries can&apos;t be edited. If one is wrong, ask someone who can verify entries to record an adjustment.</li>
          <li>
            You can delete your own drafts. People allowed to delete entries can also delete rejected and cancelled ones. Deleted entries
            disappear from lists but stay in the audit log.
          </li>
          <li>
            <strong>Cancel</strong> withdraws an entry that hasn&apos;t been approved yet.
          </li>
        </ul>
      </>
    ),
  },
  {
    slug: "scan-upi-screenshots",
    category: "recording",
    updated: "2026-10-07",
    title: "Scan a UPI screenshot",
    description: "Turn a payment screenshot into an entry: what Kosh reads, confidence scores, supported apps, and tips for a clean scan.",
    Body: () => (
      <>
        <p>
          Paid by UPI? Kosh can read the payment confirmation screenshot and fill in the entry for you. You check the values, then save.
        </p>

        <h2>How to scan</h2>
        <ol>
          <li>
            Choose <strong>Add transaction</strong> (or <strong>+</strong> on a phone) → <strong>Scan UPI screenshot</strong>.
          </li>
          <li>Choose the screenshot, or drag it onto the page on a computer.</li>
          <li>
            Wait a moment while Kosh shows <strong>Reading screenshot…</strong>.
          </li>
          <li>Check the form against the screenshot shown beside it. Add a category and description.</li>
          <li>
            Choose <strong>Save draft</strong> or <strong>Save &amp; submit</strong>. Nothing is saved until you do.
          </li>
        </ol>
        <p>The screenshot is attached to the entry automatically, so reviewers can see it too.</p>

        <h2>What Kosh reads</h2>
        <p>
          The amount, date and time, the person or business paid, their UPI ID, the transaction ID (UTR) and any reference number. For Google
          Pay it also reads the payment note. If the screenshot shows money <em>received</em>, the entry type is set to{" "}
          <strong>Cash added</strong>.
        </p>

        <h2>Confidence scores</h2>
        <p>
          Each filled-in value shows how sure Kosh is about it. Anything below 80% is highlighted as <strong>Check · N%</strong>: compare it
          with the screenshot and correct it if needed. You are responsible for what you save, so give every value a quick look.
        </p>

        <h2>Warnings</h2>
        <ul>
          <li>
            <strong>This payment shows as pending or failed:</strong> the screenshot isn&apos;t a successful payment. Wait for it to complete, or
            don&apos;t record it.
          </li>
          <li>
            <strong>Already attached to another entry:</strong> this exact screenshot has been used before, so the expense may already be
            recorded.
          </li>
        </ul>

        <h2>Supported apps</h2>
        <p>
          Google Pay, PhonePe, Paytm, BHIM, Amazon Pay, CRED, WhatsApp, super.money and Flipkart UPI, MobiKwik, Freecharge, Airtel Thanks,
          JioFinance, Navi, slice and POP, plus bank apps including SBI YONO, ICICI iMobile, HDFC PayZapp, bob World and Kotak. Screenshots
          from other apps often work as well.
        </p>

        <h2>Tips for a clean scan</h2>
        <ul>
          <li>Use the original screenshot, not a photo of the screen or an image forwarded over a chat app (those are compressed).</li>
          <li>Capture the whole success screen, with the amount and transaction ID visible. Don&apos;t crop it.</li>
          <li>Scan soon after paying, so the date and payee are fresh in your mind when you check them.</li>
        </ul>

        <Note title="Your screenshots stay private">
          Text is read on Kosh&apos;s own servers with open-source OCR software. Screenshots are never sent to a third-party AI service.
        </Note>
        <Note tone="warning" title="Scanning many at once?">
          You can scan up to 30 screenshots in 10 minutes. If you reach the limit, wait a few minutes and carry on.
        </Note>
      </>
    ),
  },
  {
    slug: "receipts-and-attachments",
    category: "recording",
    updated: "2026-10-07",
    title: "Receipts and attachments",
    description: "Attach bills, invoices and screenshots to an entry: supported files, size limits, who can see them, and the receipt-required rule.",
    Body: () => (
      <>
        <h2>What you can attach</h2>
        <ul>
          <li>JPG, PNG, WebP and PDF files.</li>
          <li>Up to 4 MB per file and 10 files per entry.</li>
          <li>Label each one as a UPI screenshot, receipt, bill, invoice or other document.</li>
        </ul>
        <p>
          Photos taken on a phone are resized before they upload, so they rarely hit the size limit. Large PDFs are the usual exception: save a
          smaller copy, or attach only the pages you need.
        </p>

        <h2>Adding and removing files</h2>
        <p>
          Attach files on the entry form, or open an entry and use its attachments section. You can add and remove files while the entry can
          still be edited. Once an entry is approved, its attachments are locked with it.
        </p>
        <p>
          Files uploaded but never saved with an entry (for example, if you close the form) are deleted automatically after about a day.
        </p>

        <h2>Who can see attachments</h2>
        <p>
          Files are stored privately. They open only for people in your company who can see the entry, and Kosh checks this each time a file is
          opened. Files are checked by their content when uploaded, so a renamed file of another type is refused.
        </p>

        <h2>When a receipt is required</h2>
        <p>
          If your company switches on <strong>Receipt required</strong> in <MenuPath>Settings → Company</MenuPath>, expenses can&apos;t be
          submitted without at least one attachment. You can still save a draft and add the receipt later.
        </p>
      </>
    ),
  },
  {
    slug: "find-entries",
    category: "recording",
    updated: "2026-10-07",
    title: "Find, filter and export entries",
    description: "Search the Transactions page, filter by date, status, category or person, and export exactly what you see.",
    Body: () => (
      <>
        <h2>Search</h2>
        <p>
          The search box on the <strong>Transactions</strong> page looks through entry numbers, descriptions, merchants, UPI IDs, transaction
          IDs, reference numbers, and the name or username of the person who created the entry.
        </p>

        <h2>Filters</h2>
        <ul>
          <li>
            <strong>Quick dates:</strong> All time, Today, This week (starting Monday), This month and Last month, or pick your own From and To
            dates.
          </li>
          <li>
            <strong>Status</strong> (choose several), <strong>category</strong>, <strong>created by</strong>, <strong>payment method</strong>,{" "}
            <strong>type</strong>, <strong>source</strong> (manual or screenshot), <strong>cash account</strong>, and a minimum or maximum
            amount.
          </li>
        </ul>
        <p>Sort by newest, oldest, highest amount or lowest amount.</p>

        <h2>Entry statuses</h2>
        <DocTable>
          <thead>
            <tr>
              <th>Status</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Draft</td>
              <td>Saved but not sent for approval. Doesn&apos;t affect the balance.</td>
            </tr>
            <tr>
              <td>Submitted</td>
              <td>Waiting for a reviewer.</td>
            </tr>
            <tr>
              <td>Pending approval</td>
              <td>Checked by a verifier and waiting for final approval.</td>
            </tr>
            <tr>
              <td>Approved</td>
              <td>Counted in the cash balance. Can no longer be edited.</td>
            </tr>
            <tr>
              <td>Rejected</td>
              <td>Sent back with a reason. Can be fixed and submitted again.</td>
            </tr>
            <tr>
              <td>Cancelled</td>
              <td>Withdrawn. Kept for the record but never counted.</td>
            </tr>
          </tbody>
        </DocTable>

        <h2>Export</h2>
        <p>
          Choose <strong>Export</strong> and pick CSV, Excel or PDF. The file contains the entries that match your current search and filters,
          up to 10,000 rows. Exporting needs the <strong>Export reports</strong> permission, and every export is recorded in the audit log.
        </p>
      </>
    ),
  },
];
