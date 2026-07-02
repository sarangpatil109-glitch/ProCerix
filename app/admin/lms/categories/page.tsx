import { createAdminClient } from "@/lib/supabase/admin";
import { CategoriesManager } from "@/components/admin/lms/categories-manager";

export default async function LmsCategoriesPage() {
  const db = createAdminClient();
  const { data: categories } = await db
    .from("lms_categories")
    .select("*")
    .order("sequence_order", { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Categories</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Organize products by category</p>
      </div>
      <CategoriesManager initialCategories={categories || []} />
    </div>
  );
}
