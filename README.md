# Kosh

Petty cash management for Indian companies. Staff record spends by scanning a UPI screenshot, typing them in, or photographing the bill; reviewers approve them; the cash balance and reports follow from what was approved.

Each company gets its own isolated space. People sign in with the company's code plus their own username and password.

## Features

- **Three ways to record a spend.** Scan a UPI payment screenshot (Google Pay, PhonePe, Paytm, BHIM, Amazon Pay, Flipkart UPI / super.money, CRED, WhatsApp, MobiKwik, Freecharge, Airtel Thanks, bank apps), enter it manually, or attach a receipt first. Scanned values are shown with a confidence score, and nothing is saved until the person confirms.
- **Approval workflow.** Draft → Submitted → (Verified) → Approved, or Rejected with a reason. The cash balance moves only on approval. Nobody reviews their own entry, except the owner of a one-person company. Approval can be switched off per company.
- **Duplicate detection** by UPI transaction ID, or by amount, date and payee, plus a warning when the same screenshot is scanned twice.
- **Receipts and screenshots** (JPG, PNG, WebP, PDF, up to 4 MB) stored in a private Supabase Storage bucket and served only after a permission check.
- **Roles and permissions.** Owner, Admin, Accountant, Cashier and Viewer out of the box, plus custom roles built from individual permissions.
- **Reports.** Daily, weekly and monthly spend; by category, user and payment method; cash-account movement; approval throughput. Export to CSV, Excel or PDF.
- **Audit log** of every change, append-only at the database level.
- **Mobile-first UI** with a bottom tab bar, swipe-to-edit rows, light and dark themes, and WCAG AA contrast with 44 px touch targets.

## Tech stack

| Area | Choice |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui on Radix, Recharts, TanStack Query |
| Data | PostgreSQL (Supabase in production) through Prisma 7 with the `pg` driver adapter |
| Auth | Own implementation: Argon2id passwords, 15-minute JWT access tokens (`jose`), rotating refresh tokens, HttpOnly cookies |
| Files | Supabase Storage (production) or local disk (development) |
| OCR | Tesseract (`tesseract.js`) on the server with `sharp` preprocessing; no external AI service |
| Email | Nodemailer over SMTP (any provider) |
| Exports | `pdfkit`, `write-excel-file` |
| Validation | Zod 4, shared by forms and API routes |

## Getting started

### Prerequisites

- Node.js 20 or newer (22 LTS recommended)
- A PostgreSQL 15+ database: a Supabase project, or local Postgres, for example with Docker:

  ```bash
  docker run -d --name kosh-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17
  ```

### Setup

```bash
git clone https://github.com/ShreeganeshKanoujiya/kosh.git
cd kosh
npm install              # also generates the Prisma client
cp .env.example .env     # then fill in the values below
npm run db:deploy        # create the tables and seed the permission catalogue
npm run dev
```

Open <http://localhost:3000/register>, create your company, and **save the company code** it shows. Everyone in the company logs in with that code.

The minimum `.env` for local development:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres"
APP_URL="http://localhost:3000"
JWT_ACCESS_SECRET="<at least 32 random characters>"
```

Generate the secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Without SMTP settings, password-reset links are printed to the server log. Without Supabase Storage, uploads are saved to `.data/uploads` (git-ignored).

## Configuration

All variables are documented in [`.env.example`](.env.example). The app validates them at startup and refuses to run with a missing or malformed value.

| Variable | Needed | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Always | Runtime database connection (Supabase: transaction pooler, port 6543) |
| `DIRECT_URL` | Always | Migrations and the Prisma CLI (Supabase: session pooler, port 5432) |
| `DATABASE_SSL_CA` | Production | Supabase's CA certificate, so the database's TLS certificate is verified |
| `DATABASE_POOL_MAX` | Optional | Connections per app instance; use 3–5 on serverless |
| `APP_URL` | Always | The address users open, e.g. `https://kosh.yourdomain.com`. Used in reset emails and for CSRF checks. |
| `JWT_ACCESS_SECRET` | Always | Signs access tokens; use a different value per environment |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET` | Production | Private storage for receipts and screenshots |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Optional | Password-reset emails |
| `UPLOAD_DIR` | Optional | Keep uploads on local disk (development or a single server; not Vercel) |

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` / `npm start` | Production build and server |
| `npm run lint` | ESLint |
| `npm run typecheck` | Generate route types, then run `tsc` |
| `npm run db:migrate` | Create and apply a new migration during development |
| `npm run db:deploy` | Apply pending migrations and sync permissions; safe to run on every release |
| `npm run db:seed` | Sync the permission catalogue and system-role permissions only |
| `npm run db:studio` | Browse the database in Prisma Studio |
| `npm run ocr:check -- <image or folder> [--raw]` | Run the screenshot reader on your own screenshots and print what it detects. With an `expected.json` in the folder, it works as a regression test. |

## Project structure

```text
prisma/            schema, migrations, permission seed
scripts/           developer tools (ocr-check)
src/
  app/             routes: (auth) pages, (app) pages, api/ route handlers
  components/      UI, grouped by feature; ui/ holds the shadcn primitives
  config/          permissions, navigation, labels, env validation
  lib/             auth, API plumbing, storage, OCR, exports, mail, security
  repositories/    all database access (always scoped to one company)
  services/        business rules: entries, approvals, reports, attachments, OCR
  validators/      Zod schemas shared by forms and API routes
  proxy.ts         session renewal and page protection (Next.js 16's replacement for middleware)
```

Requests flow route → service → repository. Services enforce permissions and the entry state machine (`src/services/entry-policy.ts`); repositories take the company ID from the verified session, never from the request.

> This project uses Next.js 16, whose APIs differ from older versions. Before changing framework-level code, check the docs bundled in `node_modules/next/dist/docs/`.

## Deployment

The recommended setup is **Vercel + Supabase** in the same region (Mumbai: Vercel `bom1`, Supabase `ap-south-1`). [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md) walks through it step by step: creating the project, connection strings, the TLS certificate, locking down the Data API, the storage bucket, environment variables and the operations checklist.

On every release, run `npm run db:deploy` against the production database, never from inside the running app.
- If a migration only adds tables or columns, run it before deploying the code.
- If it removes or renames something, deploy the code first, then migrate.

## Security

- **Company isolation.** Every query is scoped to the signed-in user's company on the server, backed by composite foreign keys. Row-level security is enabled on every table.
- **Accounts.** Passwords are hashed with Argon2id. Repeated failed logins are locked out and rate-limited.
- **Sessions.** Refresh tokens rotate, and a reused token revokes the session.
- **Requests.** Cookies use the `__Host-` prefix in production. State-changing requests are origin-checked against CSRF, and security headers include a strict Content Security Policy.
- **Uploads.** Files are checked by content (not name or declared type), stored under random names, and served only after an access check.
