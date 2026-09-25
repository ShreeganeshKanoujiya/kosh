"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { EntryDTO, EntryListDTO } from "@/types/dto";
import type { CreateEntryInput, UpdateEntryInput } from "@/validators/entry.schema";

/** Filter state mirrors the URL query string one-to-one (so views are shareable and exports can reuse it). */
export type EntryQuery = Record<string, string>;

export const entryKeys = {
  all: ["entries"] as const,
  list: (q: EntryQuery) => ["entries", "list", q] as const,
  detail: (id: string) => ["entries", "detail", id] as const,
};

export function toSearch(q: EntryQuery) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v) p.set(k, v);
  return p.toString();
}

export function useEntries(query: EntryQuery, initialData?: EntryListDTO) {
  return useQuery({
    queryKey: entryKeys.list(query),
    queryFn: async ({ signal }) => (await api<EntryListDTO>(`/api/transactions?${toSearch(query)}`, { signal })).data,
    placeholderData: keepPreviousData,
    initialData,
  });
}

export function useEntry(id: string, initialData?: EntryDTO) {
  return useQuery({
    queryKey: entryKeys.detail(id),
    queryFn: async ({ signal }) => (await api<EntryDTO>(`/api/transactions/${id}`, { signal })).data,
    initialData,
  });
}

type Transition = "submit" | "verify" | "approve" | "cancel";

export function useEntryMutations() {
  const qc = useQueryClient();
  const settle = (entry?: EntryDTO) => {
    if (entry) qc.setQueryData(entryKeys.detail(entry.id), entry);
    qc.invalidateQueries({ queryKey: entryKeys.all });
    qc.invalidateQueries({ queryKey: ["dashboard"] });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  return {
    create: useMutation({
      mutationFn: (input: CreateEntryInput) => api<EntryDTO>("/api/transactions", { method: "POST", body: input }),
      onSuccess: ({ data }) => settle(data),
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateEntryInput }) =>
        api<EntryDTO>(`/api/transactions/${id}`, { method: "PATCH", body: input }),
      onSuccess: ({ data }) => settle(data),
    }),
    transition: useMutation({
      mutationFn: ({ id, action, version }: { id: string; action: Transition; version: number }) =>
        api<EntryDTO>(`/api/transactions/${id}/${action}`, { method: "POST", body: { version } }),
      onSuccess: ({ data }) => settle(data),
    }),
    reject: useMutation({
      mutationFn: ({ id, version, reason }: { id: string; version: number; reason: string }) =>
        api<EntryDTO>(`/api/transactions/${id}/reject`, { method: "POST", body: { version, reason } }),
      onSuccess: ({ data }) => settle(data),
    }),
    remove: useMutation({
      mutationFn: ({ id, version }: { id: string; version: number }) =>
        api(`/api/transactions/${id}`, { method: "DELETE", body: { version } }),
      onSuccess: () => settle(),
    }),
  };
}
