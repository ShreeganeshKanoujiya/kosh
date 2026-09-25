-- CreateEnum
CREATE TYPE "company_status" AS ENUM ('active', 'suspended', 'closed');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'disabled');

-- CreateEnum
CREATE TYPE "entry_type" AS ENUM ('expense', 'income', 'adjustment');

-- CreateEnum
CREATE TYPE "entry_source" AS ENUM ('manual', 'upi_screenshot', 'import');

-- CreateEnum
CREATE TYPE "entry_status" AS ENUM ('draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "payment_method" AS ENUM ('cash', 'upi', 'card', 'bank_transfer', 'other');

-- CreateEnum
CREATE TYPE "attachment_kind" AS ENUM ('upi_screenshot', 'receipt', 'bill', 'invoice', 'other');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "company_code" VARCHAR(12) NOT NULL,
    "company_name" VARCHAR(120) NOT NULL,
    "owner_user_id" UUID,
    "status" "company_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_settings" (
    "company_id" UUID NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "timezone" VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    "financial_year_start_month" SMALLINT NOT NULL DEFAULT 4,
    "default_cash_account_id" UUID,
    "approval_required" BOOLEAN NOT NULL DEFAULT true,
    "receipt_required" BOOLEAN NOT NULL DEFAULT false,
    "max_expense_limit" DECIMAL(14,2),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("company_id")
);

-- CreateTable
CREATE TABLE "company_counters" (
    "company_id" UUID NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "company_counters_pkey" PRIMARY KEY ("company_id","name")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "username" VARCHAR(32) NOT NULL,
    "email" VARCHAR(254),
    "full_name" VARCHAR(120) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role_id" UUID NOT NULL,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "avatar_path" VARCHAR(512),
    "last_login_at" TIMESTAMPTZ(3),
    "password_changed_at" TIMESTAMPTZ(3),
    "created_by" UUID,
    "deleted_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "key" VARCHAR(32),
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "is_system_role" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" UUID NOT NULL,
    "permission_key" VARCHAR(64) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "permission_group" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "role_id" UUID NOT NULL,
    "permission_id" UUID NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "revoked_reason" VARCHAR(32),
    "last_used_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL,
    "token_family" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "revoked_at" TIMESTAMPTZ(3),
    "replaced_by_id" UUID,
    "last_used_at" TIMESTAMPTZ(3),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "used_at" TIMESTAMPTZ(3),
    "requested_ip" VARCHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" UUID NOT NULL,
    "company_id" UUID,
    "user_id" UUID,
    "company_code" VARCHAR(12) NOT NULL,
    "username" VARCHAR(64) NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failure_reason" VARCHAR(32),
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" VARCHAR(200) NOT NULL,
    "count" INTEGER NOT NULL,
    "reset_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "role_id" UUID NOT NULL,
    "token_hash" CHAR(64) NOT NULL,
    "invited_by" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "accepted_at" TIMESTAMPTZ(3),
    "revoked_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "description" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_accounts" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "opening_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "current_balance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "cash_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash_entries" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "cash_account_id" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "approved_by" UUID,
    "rejected_by" UUID,
    "entry_number" VARCHAR(20) NOT NULL,
    "entry_date" DATE NOT NULL,
    "entry_time" VARCHAR(5),
    "type" "entry_type" NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'INR',
    "category_id" UUID,
    "description" VARCHAR(500),
    "payment_method" "payment_method" NOT NULL,
    "merchant_name" VARCHAR(120),
    "upi_id" VARCHAR(120),
    "transaction_id" VARCHAR(64),
    "reference_number" VARCHAR(64),
    "source" "entry_source" NOT NULL DEFAULT 'manual',
    "status" "entry_status" NOT NULL DEFAULT 'draft',
    "rejection_reason" VARCHAR(500),
    "submitted_at" TIMESTAMPTZ(3),
    "approved_at" TIMESTAMPTZ(3),
    "rejected_at" TIMESTAMPTZ(3),
    "deleted_at" TIMESTAMPTZ(3),
    "deleted_by" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "petty_cash_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "transaction_id" UUID,
    "uploaded_by" UUID NOT NULL,
    "kind" "attachment_kind" NOT NULL DEFAULT 'receipt',
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "storage_path" VARCHAR(512) NOT NULL,
    "sha256" CHAR(64),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID,
    "action" VARCHAR(64) NOT NULL,
    "entity_type" VARCHAR(32) NOT NULL,
    "entity_id" VARCHAR(64),
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" VARCHAR(64),
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" VARCHAR(1000),
    "entity_type" VARCHAR(32),
    "entity_id" VARCHAR(64),
    "read_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_company_code_key" ON "companies"("company_code");

-- CreateIndex
CREATE UNIQUE INDEX "companies_owner_user_id_key" ON "companies"("owner_user_id");

-- CreateIndex
CREATE INDEX "users_company_id_status_idx" ON "users"("company_id", "status");

-- CreateIndex
CREATE INDEX "users_company_id_role_id_idx" ON "users"("company_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_username_key" ON "users"("company_id", "username");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_id_key" ON "users"("company_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_company_id_name_key" ON "roles"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_company_id_key_key" ON "roles"("company_id", "key");

-- CreateIndex
CREATE UNIQUE INDEX "roles_company_id_id_key" ON "roles"("company_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_key_key" ON "permissions"("permission_key");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE INDEX "sessions_user_id_revoked_at_idx" ON "sessions"("user_id", "revoked_at");

-- CreateIndex
CREATE INDEX "sessions_company_id_idx" ON "sessions"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_family_idx" ON "refresh_tokens"("token_family");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "login_attempts_user_id_created_at_idx" ON "login_attempts"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "login_attempts_company_code_username_created_at_idx" ON "login_attempts"("company_code", "username", "created_at" DESC);

-- CreateIndex
CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits"("reset_at");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_hash_key" ON "invitations"("token_hash");

-- CreateIndex
CREATE INDEX "invitations_company_id_email_idx" ON "invitations"("company_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_company_id_name_key" ON "categories"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_company_id_id_key" ON "categories"("company_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_accounts_company_id_name_key" ON "cash_accounts"("company_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "cash_accounts_company_id_id_key" ON "cash_accounts"("company_id", "id");

-- CreateIndex
CREATE INDEX "petty_cash_entries_company_id_entry_date_idx" ON "petty_cash_entries"("company_id", "entry_date" DESC);

-- CreateIndex
CREATE INDEX "petty_cash_entries_company_id_status_idx" ON "petty_cash_entries"("company_id", "status");

-- CreateIndex
CREATE INDEX "petty_cash_entries_company_id_category_id_idx" ON "petty_cash_entries"("company_id", "category_id");

-- CreateIndex
CREATE INDEX "petty_cash_entries_company_id_created_by_idx" ON "petty_cash_entries"("company_id", "created_by");

-- CreateIndex
CREATE INDEX "petty_cash_entries_company_id_transaction_id_idx" ON "petty_cash_entries"("company_id", "transaction_id");

-- CreateIndex
CREATE INDEX "petty_cash_entries_company_id_cash_account_id_status_idx" ON "petty_cash_entries"("company_id", "cash_account_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "petty_cash_entries_company_id_entry_number_key" ON "petty_cash_entries"("company_id", "entry_number");

-- CreateIndex
CREATE UNIQUE INDEX "petty_cash_entries_company_id_id_key" ON "petty_cash_entries"("company_id", "id");

-- CreateIndex
CREATE UNIQUE INDEX "attachments_storage_path_key" ON "attachments"("storage_path");

-- CreateIndex
CREATE INDEX "attachments_company_id_transaction_id_idx" ON "attachments"("company_id", "transaction_id");

-- CreateIndex
CREATE INDEX "attachments_company_id_sha256_idx" ON "attachments"("company_id", "sha256");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_created_at_idx" ON "audit_logs"("company_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_company_id_entity_type_entity_id_idx" ON "audit_logs"("company_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_user_id_idx" ON "audit_logs"("company_id", "user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_company_id_default_cash_account_id_fkey" FOREIGN KEY ("company_id", "default_cash_account_id") REFERENCES "cash_accounts"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_counters" ADD CONSTRAINT "company_counters_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_role_id_fkey" FOREIGN KEY ("company_id", "role_id") REFERENCES "roles"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_token_family_fkey" FOREIGN KEY ("token_family") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_company_id_role_id_fkey" FOREIGN KEY ("company_id", "role_id") REFERENCES "roles"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_accounts" ADD CONSTRAINT "cash_accounts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_company_id_cash_account_id_fkey" FOREIGN KEY ("company_id", "cash_account_id") REFERENCES "cash_accounts"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_company_id_category_id_fkey" FOREIGN KEY ("company_id", "category_id") REFERENCES "categories"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_company_id_created_by_fkey" FOREIGN KEY ("company_id", "created_by") REFERENCES "users"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_company_id_approved_by_fkey" FOREIGN KEY ("company_id", "approved_by") REFERENCES "users"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_company_id_rejected_by_fkey" FOREIGN KEY ("company_id", "rejected_by") REFERENCES "users"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_company_id_transaction_id_fkey" FOREIGN KEY ("company_id", "transaction_id") REFERENCES "petty_cash_entries"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_company_id_user_id_fkey" FOREIGN KEY ("company_id", "user_id") REFERENCES "users"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- -----------------------------------------------------------------------------
-- Hand-written additions (not expressible in schema.prisma)
-- -----------------------------------------------------------------------------

-- Data integrity checks
ALTER TABLE "companies" ADD CONSTRAINT "companies_company_code_format"
  CHECK ("company_code" ~ '^[A-Z0-9]{6,12}$');
ALTER TABLE "users" ADD CONSTRAINT "users_username_format"
  CHECK ("username" ~ '^[a-z0-9][a-z0-9._-]{2,31}$');
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_fy_month_range"
  CHECK ("financial_year_start_month" BETWEEN 1 AND 12);
ALTER TABLE "company_settings" ADD CONSTRAINT "company_settings_max_expense_positive"
  CHECK ("max_expense_limit" IS NULL OR "max_expense_limit" > 0);
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_amount_positive"
  CHECK ("amount" > 0);
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_entry_time_format"
  CHECK ("entry_time" IS NULL OR "entry_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_version_positive"
  CHECK ("version" > 0);
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_file_size_positive"
  CHECK ("file_size" > 0);

-- Audit logs are append-only. Maintenance that genuinely needs to change history
-- must disable this trigger explicitly (and that act is visible in the DB logs).
CREATE OR REPLACE FUNCTION "audit_logs_prevent_mutation"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only (% is not allowed)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

CREATE TRIGGER "audit_logs_no_update_delete"
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "audit_logs_prevent_mutation"();

CREATE TRIGGER "audit_logs_no_truncate"
  BEFORE TRUNCATE ON "audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit_logs_prevent_mutation"();

-- Row Level Security: deny-by-default for everything except the table owner / BYPASSRLS
-- role the application connects with. On Supabase this blocks the public Data API
-- (anon / authenticated keys) from reading tenant data even if it is left enabled.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'companies','company_settings','company_counters','users','roles','permissions',
    'role_permissions','sessions','refresh_tokens','password_reset_tokens','login_attempts',
    'rate_limits','invitations','categories','cash_accounts','petty_cash_entries',
    'attachments','audit_logs','notifications'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;

  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated';
    EXECUTE 'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated';
  END IF;
END $$;
