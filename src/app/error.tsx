"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StatusPage } from "@/components/common/status-page";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      code="500"
      title="Something went wrong"
      description={`We couldn't load this page. Please try again.${error.digest ? ` (Ref: ${error.digest})` : ""}`}
    >
      <Button size="lg" onClick={() => retry()}>
        Try again
      </Button>
      <Button asChild size="lg" variant="secondary">
        <Link href="/dashboard">Dashboard</Link>
      </Button>
    </StatusPage>
  );
}
