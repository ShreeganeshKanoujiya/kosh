import Link from "next/link";
import { KoshWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { MobileSiteNav } from "./mobile-site-nav";
import { ThemeToggle } from "./theme-toggle";
import { HEADER_LINKS } from "./site-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 pt-safe backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="Kosh home" className="rounded-lg">
          <KoshWordmark adaptive className="w-[5.5rem]" />
        </Link>

        <nav aria-label="Main" className="hidden flex-1 md:block">
          <ul className="flex items-center gap-1">
            {HEADER_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link href="/register">Get started</Link>
          </Button>
          <MobileSiteNav />
        </div>
      </div>
    </header>
  );
}
