import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "primary";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success/12 text-success dark:bg-success/15",
  warning: "bg-warning/20 text-warning-foreground dark:bg-warning/15 dark:text-warning",
  danger: "bg-destructive/10 text-destructive dark:bg-destructive/15",
  info: "bg-info/10 text-info dark:bg-info/15",
  primary: "bg-accent text-accent-foreground",
};

export function StatusBadge({
  tone = "neutral",
  children,
  className,
  dot = false,
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <Badge variant="secondary" className={cn("gap-1.5 border-0 font-medium", TONES[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </Badge>
  );
}
