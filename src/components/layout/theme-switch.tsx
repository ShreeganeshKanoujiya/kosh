"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

const subscribe = () => () => {};
/** True only after hydration — theme is unknown on the server. */
export function useMounted() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}

/** iOS-style segmented control for Light / Dark / System. Preference persists in localStorage. */
export function ThemeSwitch({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const current = mounted ? (theme ?? "system") : undefined;

  return (
    <div role="radiogroup" aria-label="Theme" className={cn("grid grid-cols-3 gap-1 rounded-xl bg-muted p-1", className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-10 items-center justify-center gap-1.5 rounded-lg text-sm font-medium text-muted-foreground transition-colors md:h-8",
              active && "bg-card text-foreground shadow-xs",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
