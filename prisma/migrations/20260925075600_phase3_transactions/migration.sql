-- AlterTable
ALTER TABLE "petty_cash_entries" ADD COLUMN     "auto_approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verified_at" TIMESTAMPTZ(3),
ADD COLUMN     "verified_by" UUID;

-- CreateIndex
CREATE INDEX "petty_cash_entries_company_id_status_entry_date_idx" ON "petty_cash_entries"("company_id", "status", "entry_date" DESC);

-- CreateIndex
CREATE INDEX "petty_cash_entries_company_id_deleted_at_entry_date_created_idx" ON "petty_cash_entries"("company_id", "deleted_at", "entry_date" DESC, "created_at" DESC);

-- AddForeignKey
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_company_id_verified_by_fkey" FOREIGN KEY ("company_id", "verified_by") REFERENCES "users"("company_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Adjustments carry a sign (+ increases, - decreases the balance); expenses and income are always positive.
ALTER TABLE "petty_cash_entries" DROP CONSTRAINT "petty_cash_entries_amount_positive";
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_amount_sign"
  CHECK (("type" = 'adjustment' AND "amount" <> 0) OR ("type" <> 'adjustment' AND "amount" > 0));

-- Approved entries must record who approved them and when.
ALTER TABLE "petty_cash_entries" ADD CONSTRAINT "petty_cash_entries_approved_consistency"
  CHECK ("status" <> 'approved' OR "approved_at" IS NOT NULL);
