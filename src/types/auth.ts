import type { PermissionKey } from "@/config/permissions";

/**
 * Server-derived identity for the current request. Built from the verified access
 * token + a database lookup — never from anything the client sends.
 */
export interface AuthContext {
  userId: string;
  companyId: string;
  sessionId: string;
  roleId: string;
  roleKey: string | null;
  roleName: string;
  isOwner: boolean;
  permissions: ReadonlySet<PermissionKey>;
  user: {
    username: string;
    fullName: string;
    email: string | null;
    avatarPath: string | null;
  };
  company: {
    code: string;
    name: string;
  };
}
