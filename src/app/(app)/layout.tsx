import { redirect } from "next/navigation";
import { MobileHeader } from "@/components/layout/mobile-header";
import { MobileTabBar } from "@/components/layout/mobile-tab-bar";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SessionProvider } from "@/components/session-provider";
import { getAuthContext } from "@/lib/auth/session";
import { getMe } from "@/services/auth.service";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Layouts don't re-run on client navigation, so each page also calls requirePageAuth().
  const auth = await getAuthContext();
  if (!auth) redirect("/login?reason=session");
  const me = await getMe(auth);

  return (
    <SessionProvider me={me}>
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <div className="min-h-dvh md:flex">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileHeader />
          <TopBar />
          <main
            id="main"
            className="mx-auto w-full max-w-7xl flex-1 px-4 pt-5 pb-[calc(var(--tab-bar-height)+env(safe-area-inset-bottom)+1.5rem)] md:px-6 md:pt-8 md:pb-12 lg:px-8"
          >
            {children}
          </main>
        </div>
        <MobileTabBar />
      </div>
    </SessionProvider>
  );
}
