import Link from "next/link";
import { StatusPage } from "@/components/common/status-page";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <StatusPage code="401" title="Session expired" description="For your security, please log in again to continue.">
      <Button asChild size="lg">
        <Link href="/login?reason=session">Log in again</Link>
      </Button>
    </StatusPage>
  );
}
