"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api-client";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const logout = useCallback(
    async (everywhere = false) => {
      setPending(true);
      try {
        await api(everywhere ? "/api/auth/logout-all" : "/api/auth/logout", { method: "POST" });
        queryClient.clear();
        if (everywhere) toast.success("Logged out from all devices");
        router.replace("/login?reason=logout");
        router.refresh();
      } catch (error) {
        toast.error(errorMessage(error, "Unable to log out. Please try again."));
        setPending(false);
      }
    },
    [queryClient, router],
  );

  return { logout, pending };
}
