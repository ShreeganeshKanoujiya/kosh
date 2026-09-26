"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { CashAccountDTO, CategoryDTO, CompanySettingsDTO, UserDTO } from "@/types/dto";
import type { Paginated } from "@/types/api";
import type { CashAccountInput, CategoryInput, UpdateCashAccountInput, UpdateSettingsInput } from "@/validators/company.schema";

export function useCategories(options: { activeOnly?: boolean } = {}) {
  return useQuery({
    queryKey: ["categories", options.activeOnly ? "active" : "all"],
    queryFn: async ({ signal }) =>
      (await api<CategoryDTO[]>(`/api/categories${options.activeOnly ? "?active=true" : ""}`, { signal })).data,
    staleTime: 60_000,
  });
}

export function useCashAccounts(options: { activeOnly?: boolean } = {}) {
  return useQuery({
    queryKey: ["cash-accounts", options.activeOnly ? "active" : "all"],
    queryFn: async ({ signal }) =>
      (await api<CashAccountDTO[]>(`/api/cash-accounts${options.activeOnly ? "?active=true" : ""}`, { signal })).data,
    staleTime: 60_000,
  });
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ["company-settings"],
    queryFn: async ({ signal }) => (await api<CompanySettingsDTO>("/api/company", { signal })).data,
    staleTime: 60_000,
  });
}

/** People who can appear in the "created by" filter (users.read required; empty otherwise). */
export function useUserOptions(enabled: boolean) {
  return useQuery({
    queryKey: ["users", "options"],
    queryFn: async ({ signal }) =>
      (await api<Paginated<UserDTO>>("/api/users?pageSize=100", { signal })).data.items.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        username: u.username,
      })),
    enabled,
    staleTime: 60_000,
  });
}

export function useReferenceMutations() {
  const qc = useQueryClient();
  return {
    createCategory: useMutation({
      mutationFn: (input: CategoryInput) => api<CategoryDTO>("/api/categories", { method: "POST", body: input }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    }),
    updateCategory: useMutation({
      mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
        api<CategoryDTO>(`/api/categories/${id}`, { method: "PATCH", body: input }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    }),
    deleteCategory: useMutation({
      mutationFn: (id: string) => api(`/api/categories/${id}`, { method: "DELETE" }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
    }),
    createCashAccount: useMutation({
      mutationFn: (input: CashAccountInput) => api<CashAccountDTO>("/api/cash-accounts", { method: "POST", body: input }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ["cash-accounts"] }),
    }),
    updateCashAccount: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateCashAccountInput }) =>
        api<CashAccountDTO>(`/api/cash-accounts/${id}`, { method: "PATCH", body: input }),
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["cash-accounts"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      },
    }),
    updateSettings: useMutation({
      mutationFn: (input: UpdateSettingsInput) =>
        api<CompanySettingsDTO>("/api/company/settings", { method: "PATCH", body: input }),
      onSuccess: ({ data }) => {
        qc.setQueryData(["company-settings"], data);
        qc.invalidateQueries({ queryKey: ["cash-accounts"] });
      },
    }),
  };
}

