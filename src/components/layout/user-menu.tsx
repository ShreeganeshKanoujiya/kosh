"use client";

import { LogOut, Monitor, Moon, MonitorSmartphone, Settings, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { UserAvatar } from "@/components/common/user-avatar";
import { useSession } from "@/components/session-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLogout } from "@/hooks/use-logout";
import { cn } from "@/lib/utils";
import { useMounted } from "./theme-switch";

export function UserMenu({ variant = "avatar" }: { variant?: "avatar" | "sidebar" }) {
  const me = useSession();
  const { logout, pending } = useLogout();
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-3 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          variant === "sidebar" ? "w-full p-2 hover:bg-sidebar-accent" : "rounded-full p-0.5",
        )}
        aria-label="Account menu"
      >
        <UserAvatar name={me.user.fullName} seed={me.user.id} className={variant === "avatar" ? "size-9" : undefined} />
        {variant === "sidebar" && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{me.user.fullName}</span>
            <span className="block truncate text-xs text-muted-foreground">{me.role.name}</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={variant === "sidebar" ? "right" : "bottom"} className="w-64">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{me.user.fullName}</p>
          <p className="truncate text-xs text-muted-foreground">
            @{me.user.username} · {me.role.name}
          </p>
          <p className="mt-1.5 truncate text-xs text-muted-foreground">
            {me.company.name} · <span className="font-mono tracking-wider">{me.company.code}</span>
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {mounted && theme === "dark" ? <Moon /> : mounted && theme === "light" ? <Sun /> : <Monitor />}
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={mounted ? theme : undefined} onValueChange={setTheme}>
                <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onSelect={() => logout(false)}>
          <LogOut />
          Log out
        </DropdownMenuItem>
        <DropdownMenuItem disabled={pending} onSelect={() => logout(true)}>
          <MonitorSmartphone />
          Log out of all devices
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
