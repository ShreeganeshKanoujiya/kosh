import Link from "next/link";
import { GoBackButton } from "@/components/common/go-back-button";
import { StatusPage } from "@/components/common/status-page";
import { Button } from "@/components/ui/button";

export default function Forbidden() {
  return (
    <StatusPage
      code="403"
      title="Access denied"
      description="You don't have permission to access this page. Ask your company admin if you need access."
    >
      <GoBackButton />
      <Button asChild size="lg" variant="secondary">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
    </StatusPage>
  );
}
