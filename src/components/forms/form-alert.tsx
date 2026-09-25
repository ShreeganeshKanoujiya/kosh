import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function FormAlert({
  message,
  title,
  tone = "error",
  className,
}: {
  message?: string | null;
  title?: string;
  tone?: "error" | "success" | "info";
  className?: string;
}) {
  if (!message) return null;
  const Icon = tone === "error" ? AlertCircle : tone === "success" ? CheckCircle2 : Info;
  return (
    <Alert
      variant={tone === "error" ? "destructive" : "default"}
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        tone === "success" && "border-success/30 bg-success/5 text-success",
        tone === "info" && "border-info/30 bg-info/5",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
