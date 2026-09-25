"use client";

import { Check, CheckCircle2, Copy, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { RegisterResultDTO } from "@/types/dto";

export function CompanyCodeReveal({ result }: { result: RegisterResultDTO }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const code = result.company.code;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Company code copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy — please write the code down.");
    }
  }

  function download() {
    const text =
      `Kosh — company login details\n\n` +
      `Company: ${result.company.name}\nCompany code: ${code}\nOwner username: ${result.user.username}\n\n` +
      `Keep this safe. Everyone in your company logs in with this code.\n`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `kosh-${code}.txt` });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-3">
        <span className="mx-auto inline-flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h1 className="text-page-title">Company created successfully</h1>
        <p className="text-caption text-[0.9375rem]">{result.company.name}</p>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-xs">
        <p className="text-meta font-medium tracking-wide uppercase">Company code</p>
        <p
          className="mt-3 font-mono text-4xl font-semibold tracking-[0.3em] select-all sm:text-5xl"
          aria-label={`Company code: ${code.split("").join(" ")}`}
        >
          {code}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copied" : "Copy code"}
          </Button>
          <Button variant="ghost" onClick={download}>
            <Download />
            Save as file
          </Button>
        </div>
      </div>

      <div className="space-y-1 text-left text-sm">
        <p className="font-medium">Save this code securely.</p>
        <p className="text-muted-foreground">
          You and your team need it every time you log in. Share it only with people you add to your company.
        </p>
      </div>

      <div className="flex items-center gap-3 rounded-xl border bg-card p-4 text-left">
        <Checkbox id="saved" checked={saved} onCheckedChange={(v) => setSaved(v === true)} />
        <Label htmlFor="saved" className="font-normal">
          I&apos;ve saved my company code
        </Label>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!saved}
        onClick={() => {
          try {
            localStorage.setItem("kosh-company-code", code);
          } catch {
            // ignore
          }
          router.replace("/dashboard");
          router.refresh();
        }}
      >
        Continue to dashboard
      </Button>
    </div>
  );
}
