import type { Metadata } from "next";
import { UsersView } from "@/components/users/users-view";
import { requirePageAuth } from "@/lib/auth/session";
import { listUsers } from "@/services/user.service";

export const metadata: Metadata = { title: "Users" };

export default async function UsersPage() {
  const auth = await requirePageAuth("users.read");
  // First page rendered on the server; filtering and paging continue client-side against the API.
  const initialData = await listUsers(auth, { page: 1, pageSize: 20 });
  return <UsersView initialData={initialData} />;
}
