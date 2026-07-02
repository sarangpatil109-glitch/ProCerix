import { createAdminClient } from "@/lib/supabase/admin";
import { CategoriesManager } from "@/components/admin/lms/categories-manager";

export default async function LmsCategoriesPage() {
  const sdb = createAdminClient();
  const db = sdb as any;

  const [{ data: categories }, { data: courses }] = await Promise.all([
    db.from("lms_categories").select("*").order("sequence_order", { ascending: true }),
    db.from("courses")
      .select("id, title, course_type, is_published, category")
      .is("deleted_at", null)
      .order("title"),
  ]);

  const normalizedCats = (categories || []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description ?? null,
    icon: c.icon ?? null,
    color: c.color ?? null,
    is_active: c.is_active ?? true,
    sequence_order: c.sequence_order ?? 0,
  }));

  const normalizedCourses = (courses || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    course_type: c.course_type,
    is_published: c.is_published,
    category: c.category ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Categories</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {normalizedCats.length} categories · Organize and assign products
        </p>
      </div>
      <CategoriesManager initialCategories={normalizedCats} courses={normalizedCourses} />
    </div>
  );
}
