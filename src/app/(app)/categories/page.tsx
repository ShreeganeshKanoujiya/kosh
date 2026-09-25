import type { Metadata } from "next";
import { CategoriesView } from "@/components/categories/categories-view";
import { requirePageAuth } from "@/lib/auth/session";
import { listCategories } from "@/services/category.service";

export const metadata: Metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const auth = await requirePageAuth("categories.read");
  return <CategoriesView initialData={await listCategories(auth)} />;
}
