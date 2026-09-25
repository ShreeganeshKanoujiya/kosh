"use client";

import { createContext, useContext, useMemo } from "react";
import type { PermissionKey } from "@/config/permissions";
import type { MeDTO } from "@/types/dto";

interface SessionValue extends MeDTO {
  can: (...permissions: PermissionKey[]) => boolean;
  canAny: (...permissions: PermissionKey[]) => boolean;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Current user for Client Components. Used only to hide controls the user can't
 * use — the API enforces every permission again server-side.
 */
export function SessionProvider({ me, children }: { me: MeDTO; children: React.ReactNode }) {
  const value = useMemo<SessionValue>(() => {
    const set = new Set<string>(me.permissions);
    return {
      ...me,
      can: (...p) => p.every((x) => set.has(x)),
      canAny: (...p) => p.some((x) => set.has(x)),
    };
  }, [me]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}
