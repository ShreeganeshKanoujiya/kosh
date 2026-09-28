-- Google Sheets export was removed.
ALTER TABLE "company_settings" DROP COLUMN "google_sheet_id";

-- Its permissions go too; role grants follow via ON DELETE CASCADE on role_permissions.
DELETE FROM "permissions" WHERE "permission_key" IN ('google_sheets.export', 'google_sheets.sync');
