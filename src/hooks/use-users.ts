"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Paginated } from "@/types/api";
import type { RoleDTO, RoleSummaryDTO, UserDTO } from "@/types/dto";
import type { AdminResetPasswordInput, CreateUserInput, UpdateUserInput } from "@/validators/user.schema";

export interface UserFilters {
  search?: string;
  status?: "active" | "disabled";
  roleId?: string;
  page: number;
  pageSize: number;
}

export const userKeys = {
  all: ["users"] as const,
  list: (f: UserFilters) => ["users", "list", f] as const,
  assignableRoles: ["roles", "assignable"] as const,
};

function toQuery(f: UserFilters) {
  const p = new URLSearchParams({ page: String(f.page), pageSize: String(f.pageSize) });
  if (f.search) p.set("search", f.search);
  if (f.status) p.set("status", f.status);
  if (f.roleId) p.set("roleId", f.roleId);
  return p.toString();
}

export function useUsers(filters: UserFilters, initialData?: Paginated<UserDTO>) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async ({ signal }) => (await api<Paginated<UserDTO>>(`/api/users?${toQuery(filters)}`, { signal })).data,
    placeholderData: keepPreviousData,
    initialData,
  });
}

export function useAssignableRoles(enabled = true) {
  return useQuery({
    queryKey: userKeys.assignableRoles,
    queryFn: async ({ signal }) => (await api<RoleDTO[]>("/api/roles/assignable", { signal })).data,
    enabled,
    staleTime: 60_000,
  });
}

export function useRoleOptions() {
  return useQuery({
    queryKey: ["roles", "options"],
    queryFn: async ({ signal }) => (await api<RoleSummaryDTO[]>("/api/roles/options", { signal })).data,
    staleTime: 60_000,
  });
}

export function useUserMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: userKeys.all });

  return {
    create: useMutation({
      mutationFn: (input: CreateUserInput) => api<UserDTO>("/api/users", { method: "POST", body: input }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, input }: { id: string; input: UpdateUserInput }) =>
        api<UserDTO>(`/api/users/${id}`, { method: "PATCH", body: input }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api(`/api/users/${id}`, { method: "DELETE" }),
      onSuccess: invalidate,
    }),
    resetPassword: useMutation({
      mutationFn: ({ id, input }: { id: string; input: AdminResetPasswordInput }) =>
        api(`/api/users/${id}/reset-password`, { method: "POST", body: input }),
    }),
    revokeSessions: useMutation({
      mutationFn: (id: string) => api<{ sessionsRevoked: number }>(`/api/users/${id}/revoke-sessions`, { method: "POST" }),
    }),
  };
}
