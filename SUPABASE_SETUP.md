# Supabase setup

This guide connects Kosh to a Supabase project, from a new project to a production deploy. It takes about 15 minutes.

**What Kosh uses Supabase for**

| Supabase feature | Used by Kosh | Notes |
| --- | --- | --- |
| **Postgres database** | Yes (required) | The source of truth for every company, user and transaction. Accessed only from the server, through Prisma. |
| **Storage** | Yes (for receipts and UPI screenshots) | A private bucket. Files are uploaded and served only by the server. See [step 9](#9-storage-for-receipts-and-upi-screenshots). |
| Auth | **No** | Kosh has its own login (company code + username + password) with JWT access tokens and rotating refresh tokens. |
| Data API (PostgREST) / `supabase-js` on the client | **No** | Turn it off (step 6). The browser never talks to the database directly. |

---

## 1. Create the project

1. Go to <https://supabase.com/dashboard> and select **New project**.
2. **Name:** for example `kosh-production`. Create a separate project for staging.
3. **Database password:** select **Generate a password** and store it in your password manager. You need it for the connection strings.
4. **Region:** choose the region closest to your users and to where the app is hosted. For India, use **South Asia (Mumbai) `ap-south-1`**, and host the app in the same region (for example Vercel `bom1`).
5. Select **Create new project** and wait for provisioning to finish.

## 2. Get the connection strings

Open the project and select **Connect** in the top bar. Supabase offers three kinds of connection. Kosh uses two of them:

| Connection | Port | Kosh variable | Used for |
| --- | --- | --- | --- |
| **Transaction pooler** (Supavisor) | `6543` | `DATABASE_URL` | The running app. Scales to many short-lived serverless instances. |
| **Session pooler** (Supavisor) | `5432` | `DIRECT_URL` | Prisma migrations and `prisma studio`. Needs a real session, which the transaction pooler can't provide. |
| Direct connection | `5432` | *(optional)* `DIRECT_URL` | Also works for migrations, but it's IPv6-only unless you buy the IPv4 add-on. The session pooler is simpler. |

The pooler strings look like this. Note that the username includes the project ref:

```
postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres
postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

> If your password contains characters such as `@ : / ? # %`, URL-encode them in the connection string (`@` becomes `%40`, and so on).

## 3. Optional (recommended): create a dedicated database user for Prisma

With a separate user you can rotate its password, or revoke it, without touching the `postgres` superuser. Open **SQL Editor**, select **New query**, and run this (choose your own password):

```sql
create user "prisma" with password 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD' bypassrls createdb;
grant "prisma" to "postgres";

grant usage, create on schema public to prisma;
grant all on all tables    in schema public to prisma;
grant all on all routines  in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables    to prisma;
alter default privileges for role postgres in schema public grant all on routines  to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

Then use `prisma.<project-ref>` as the username, with this password, in both connection strings. `bypassrls` is needed because Kosh enables row-level security on every table; see step 6.

## 4. Verify TLS with the Supabase CA certificate

Supabase signs its database certificates with its own certificate authority, which Node.js doesn't trust by default. Recent versions of `node-postgres` treat `sslmode=require` as full certificate verification. Without the CA certificate, the app therefore fails with `self-signed certificate in certificate chain`.

1. Go to **Project Settings → Database → SSL Configuration** and select **Download certificate**.
2. Put the file's contents into `DATABASE_SSL_CA`, on one line, with a literal `\n` at each line break:

   ```bash
   # macOS / Linux / Git Bash: prints a value you can paste into .env
   awk 'NF {printf "%s\\n", $0}' prod-ca-2021.crt
   ```

3. On the same settings page, turn on **Enforce SSL on incoming connections**.

When `DATABASE_SSL_CA` is set, Kosh connects with `rejectUnauthorized: true` and ignores any `sslmode` in `DATABASE_URL` (see `src/lib/db/prisma.ts`). The Prisma CLI, which runs migrations, uses `DIRECT_URL` with `?sslmode=require`.

## 5. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```dotenv
DATABASE_URL="postgresql://postgres.<ref>:<password>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.<ref>:<password>@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
DATABASE_SSL_CA="-----BEGIN CERTIFICATE-----\nMIID...\n-----END CERTIFICATE-----\n"
DATABASE_POOL_MAX="5"

APP_URL="http://localhost:3000"
JWT_ACCESS_SECRET="<output of: openssl rand -base64 48>"
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Runtime connection through the transaction pooler (6543). |
| `DIRECT_URL` | Yes | Migrations and the Prisma CLI through the session pooler (5432). |
| `DATABASE_SSL_CA` | Production | Supabase CA certificate, so TLS is verified. |
| `DATABASE_POOL_MAX` | No | Connections per app instance (default 10). Use **3–5 on serverless**; Supavisor does the multiplexing. |
| `APP_URL` | Yes | The app's public URL. Used in password-reset links and to validate the request origin for CSRF protection. |
| `JWT_ACCESS_SECRET` | Yes | At least 32 characters. Signs 15-minute access tokens. Rotating it signs everyone out on their next request. |
| `ACCESS_TOKEN_TTL_MINUTES` / `REFRESH_TOKEN_TTL_DAYS` / `SESSION_MAX_AGE_DAYS` | No | Defaults are 15 minutes, 7 days and 30 days. |
| `RESEND_API_KEY`, `MAIL_FROM` | No | Emails for password resets. Without them, reset links are printed to the server log in development only. |

The app validates these at startup (`src/instrumentation.ts`) and refuses to start if a required value is missing or malformed.

## 6. Lock down the Data API

Kosh never uses Supabase's auto-generated REST/GraphQL API. By default, the `public` schema is exposed to anyone who has the project's anon key, so close it:

1. Go to **Project Settings → Data API** and turn off **Enable Data API**. If you need it for something else, remove `public` from **Exposed schemas** instead.

The initial migration is a second layer of protection even if the Data API were re-enabled:

- **Row-level security is enabled on every table**, with no policies. The `anon` and `authenticated` roles therefore can't read or write anything.
- All table privileges are **revoked from `anon` and `authenticated`**.
- The app's own connection (`postgres`, or the `prisma` user with `BYPASSRLS`) is unaffected. Tenant isolation is enforced in the application layer and by composite foreign keys.

> **For future migrations:** every new table must include `ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;` in its migration SQL.

## 7. Create the schema

```bash
npm install          # also runs `prisma generate`
npm run db:deploy    # prisma migrate deploy + seed the permission catalogue
```

`db:deploy` is idempotent and safe to run on every deploy. It:

1. applies pending migrations in `prisma/migrations/` using `DIRECT_URL`;
2. syncs the permission catalogue (`src/config/permissions.ts`) into the `permissions` table, and re-applies the default permissions to every company's system roles.

To check the result, open **Table Editor**. You should see `companies`, `users`, `roles`, `petty_cash_entries`, `audit_logs` and the other tables, each marked **RLS enabled**.

Then start the app:

```bash
npm run dev
```

Open <http://localhost:3000/register>, create your company, and **save the company code** it shows you. Everyone logs in with that code, their username and their password.

## 8. Deploy (Vercel example)

1. Import the repository in Vercel. The framework preset is Next.js, and the build command (`npm run build`) runs `prisma generate` automatically.
2. Add every variable from step 5 under **Settings → Environment Variables**. Set `APP_URL` to the production URL (for example `https://kosh.yourdomain.com`) and use a **different** `JWT_ACCESS_SECRET` for each environment.
3. Set **Settings → Functions → Region** to the same region as the database (`bom1` for Mumbai).
4. Run migrations **before** each release, from CI or your machine, never from inside the running app:

   ```bash
   DATABASE_URL=... DIRECT_URL=... npm run db:deploy
   ```

Auth cookies are `HttpOnly`, `Secure` and `SameSite=Lax`, and use the `__Host-` prefix in production, so the site must be served over HTTPS (Vercel does this by default).

## 9. Storage for receipts and UPI screenshots

Attachments are stored in Supabase Storage, never in Postgres. Set this up before enabling receipt and screenshot uploads:

1. Go to **Storage → New bucket**:
   - **Name:** `attachments`
   - **Public bucket:** **Off.** Files are only ever served through short-lived signed URLs issued by the server after a permission check.
   - **File size limit:** `10 MB`
   - **Allowed MIME types:** `image/jpeg, image/png, image/webp, application/pdf`
2. Go to **Project Settings → API** and copy the **Project URL** and the **`service_role` secret**.
3. Add them to the environment:

   ```dotenv
   SUPABASE_URL="https://<project-ref>.supabase.co"
   SUPABASE_SERVICE_ROLE_KEY="<service_role secret>"   # server-only, never NEXT_PUBLIC_
   SUPABASE_STORAGE_BUCKET="attachments"
   ```

The `service_role` key bypasses all Storage policies. It's used only in server code, and a variable without the `NEXT_PUBLIC_` prefix can't be bundled into client JavaScript by Next.js. Object keys are random and scoped by company (`<company_id>/<yyyy>/<mm>/<random>.<ext>`). Uploaded filenames are never used as storage paths.

## 10. Operations checklist

- **Backups:** paid plans take daily backups automatically. Turn on **Point-in-Time Recovery** (**Database → Backups**) for financial data.
- **Password rotation:** to rotate the database password, update `DATABASE_URL` and `DIRECT_URL` everywhere and redeploy. If you use the dedicated `prisma` user, rotate it with `alter user prisma with password '...'`.
- **Connections:** check **Reports → Database** for connection saturation. If you see `too many clients`, lower `DATABASE_POOL_MAX`.
- **Audit log:** `audit_logs` is append-only, enforced by a trigger. Updates and deletes fail even from the SQL editor. If maintenance ever genuinely requires changing it, disable the trigger explicitly and record why.
- **Retention:** the `login_attempts` and `rate_limits` tables grow over time. Expired rate-limit windows are pruned automatically. Archive login attempts older than your retention policy (for example 1 year) with a scheduled job.

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `self-signed certificate in certificate chain` | TLS verification without the Supabase CA. Set `DATABASE_SSL_CA` (step 4). |
| `prepared statement "s0" already exists` / migrations hang | Migrations are running through the transaction pooler (6543). Point `DIRECT_URL` at the session pooler (5432). |
| `Tenant or user not found` | The pooler username must be `postgres.<project-ref>` (or `prisma.<project-ref>`), not plain `postgres`. |
| `Can't reach database server` using the direct host | The direct connection is IPv6-only. Use the session pooler string instead. |
| `password authentication failed` | Wrong password, or special characters that aren't URL-encoded. |
| `Permission catalogue is out of date. Run npm run db:seed` | A deploy added permissions but the seed didn't run. Run `npm run db:seed`. |
| App starts but every page redirects to `/login` in production | `APP_URL` doesn't match the real domain, or the site isn't served over HTTPS (`__Host-` cookies require HTTPS). |

## Local development without Supabase

Any PostgreSQL 15+ server works. For example, with Docker:

```bash
docker run -d --name kosh-db -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:17
```

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/postgres"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/postgres"
```

Leave `DATABASE_SSL_CA` empty locally, then run `npm run db:deploy` followed by `npm run dev`.
