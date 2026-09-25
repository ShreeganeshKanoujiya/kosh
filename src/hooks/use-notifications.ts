"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async ({ signal }) =>
      (await api<{ unread: number; items: NotificationItem[] }>("/api/notifications", { signal })).data,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { all: true } | { ids: string[] }) => api("/api/notifications/read", { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
