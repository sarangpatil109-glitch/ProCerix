import { createClient } from "@/lib/supabase/server";
import { GenericCRUDEngine, CRUDConfig } from "@/components/admin/crud-engine";

export default async function AdminCourses() {
  const supabase = await createClient();
  const { data: courses } = await supabase.from("courses").select("*").order("created_at", { ascending: false });

  const config: CRUDConfig = {
    entityName: "Course",
    tableName: "courses",
    columns: [
      { key: "title", title: "Title", type: "text" },
      { key: "slug", title: "Slug", type: "text" },
      { key: "difficulty", title: "Difficulty", type: "enum", options: ["beginner", "intermediate", "advanced"] },
      { key: "course_type", title: "Type", type: "enum", options: ["certificate", "internship"] },
      { key: "price", title: "Price", type: "number" },
      { key: "original_price", title: "Original Price", type: "number" },
      { key: "discount", title: "Discount %", type: "number" },
      { key: "duration", title: "Duration", type: "text" },
      { key: "is_featured", title: "Featured", type: "boolean" },
      { key: "is_published", title: "Published", type: "boolean" }
    ],
    actions: { create: true, edit: true, delete: true },
    customEditRoute: (id) => `/admin/courses/${id}`,
    bulkActions: { publish: true, feature: true, delete: true }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Manage Courses</h2>
      <GenericCRUDEngine config={config} data={courses || []} />
    </div>
  );
}
