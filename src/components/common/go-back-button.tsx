"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function GoBackButton({ fallback = "/dashboard" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <Button
      size="lg"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
    >
      <ArrowLeft />
      Go back
    </Button>
  );
}
