import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsView } from "@/components/reports/reports-view";
import { Skeleton } from "@/components/ui/skeleton";
import { requirePageAuth } from "@/lib/auth/session";
import { todayYmd } from "@/lib/dates";
import { sheetsExportAvailable } from "@/services/google-sheets.service";
import { settingsRepository } from "@/repositories/settings.repository";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const auth = await requirePageAuth("reports.read");
  const settings = await settingsRepository.get(auth.companyId);
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
      <ReportsView
        today={todayYmd(settings.timezone)}
        financialYearStartMonth={settings.financialYearStartMonth}
        sheetsEnabled={sheetsExportAvailable(auth, settings)}
      />
    </Suspense>
  );
}
