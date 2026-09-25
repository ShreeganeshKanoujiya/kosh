import Link from "next/link";
import { StatusPage } from "@/components/common/status-page";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <StatusPage code="404" title="Page not found" description="The page you're looking for doesn't exist or has moved.">
      <Button asChild size="lg">
        <Link href="/dashboard">Go to dashboard</Link>
      </Button>
    </StatusPage>
  );
}
