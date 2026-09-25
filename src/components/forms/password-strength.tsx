"use client";

import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { checkPassword, passwordScore } from "@/validators/password";

const LABELS = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const BAR_COLORS = ["bg-destructive", "bg-destructive", "bg-warning", "bg-success", "bg-success"];

export function PasswordStrength({ password, username }: { password: string; username?: string }) {
  const checks = checkPassword(password, { username });
  const score = passwordScore(password, { username });

  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn("h-1 flex-1 rounded-full bg-muted transition-colors", password && i < score && BAR_COLORS[score])}
            />
          ))}
        </div>
        <span className="text-meta w-16 text-right">{password ? LABELS[score] : ""}</span>
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {checks.map((c) => (
          <li
            key={c.id}
            className={cn("flex items-center gap-1.5 text-xs", c.passed ? "text-success" : "text-muted-foreground")}
          >
            {c.passed ? <Check className="size-3.5" aria-hidden /> : <Circle className="size-3" aria-hidden />}
            <span>
              {c.label}
              <span className="sr-only">{c.passed ? " (met)" : " (not met)"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
