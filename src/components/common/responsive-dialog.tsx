"use client";

import { createContext, useContext } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsDesktop } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

const ModeContext = createContext<"dialog" | "drawer">("dialog");

/**
 * Centered dialog on tablet/desktop, bottom sheet on phones.
 *
 * Children are unmounted when closed, so forms inside start fresh every time they
 * open — no reset effects needed. Compose with <ResponsiveDialogBody> and
 * <ResponsiveDialogFooter> (wrap both in a `<form className="contents">`).
 */
export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={cn("flex max-h-[90dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg", className)}>
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle>{title}</DialogTitle>
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
          <ModeContext.Provider value="dialog">{children}</ModeContext.Provider>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <ModeContext.Provider value="drawer">{children}</ModeContext.Provider>
      </DrawerContent>
    </Drawer>
  );
}

export function ResponsiveDialogBody({ children, className }: { children: React.ReactNode; className?: string }) {
  const mode = useContext(ModeContext);
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto", mode === "dialog" ? "px-6 py-5" : "px-4 pb-4", className)}>
      {children}
    </div>
  );
}

/** Sticky action row — the primary action stays reachable above the keyboard / home indicator. */
export function ResponsiveDialogFooter({ children }: { children: React.ReactNode }) {
  const mode = useContext(ModeContext);
  return mode === "dialog" ? (
    <DialogFooter className="mx-0 mb-0 rounded-b-xl border-t bg-muted/40 px-6 py-4">{children}</DialogFooter>
  ) : (
    <DrawerFooter className="border-t pb-[max(1rem,env(safe-area-inset-bottom))] *:w-full">{children}</DrawerFooter>
  );
}
