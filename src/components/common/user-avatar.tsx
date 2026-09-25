import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

// Deterministic, calm tints so people are recognisable in lists.
const TINTS = [
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
  "bg-teal-100 text-teal-800 dark:bg-teal-500/15 dark:text-teal-300",
];

function tintFor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

export function UserAvatar({ name, seed, className }: { name: string; seed?: string; className?: string }) {
  return (
    <Avatar className={cn("size-8", className)}>
      <AvatarFallback className={cn("text-xs font-semibold", tintFor(seed ?? name))}>{initials(name)}</AvatarFallback>
    </Avatar>
  );
}
