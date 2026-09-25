import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/** Full-page status screen used by 401 / 403 / 404 / 500. */
export function StatusPage({
  code,
  title,
  description,
  children,
  className,
}: {
  code: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center", className)}>
      <LogoMark className="mb-8 size-10" />
      <p className="font-mono text-sm font-medium tracking-widest text-primary">{code}</p>
      <h1 className="mt-2 text-page-title">{title}</h1>
      <p className="mt-2 max-w-sm text-caption text-[0.9375rem]">{description}</p>
      {children && <div className="mt-8 flex flex-wrap justify-center gap-3">{children}</div>}
    </main>
  );
}
