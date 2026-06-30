import { createAdminClient } from "@/lib/supabase/admin";
import { GenericCRUDEngine, CRUDConfig } from "@/components/admin/crud-engine";

export default async function AdminCourses() {
  const supabase = createAdminClient();
  // Only certificates — internships live in their own table
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .neq("course_type", "internship")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const config: CRUDConfig = {
    entityName: "Course",
    tableName: "courses",
    columns: [
      { key: "title", title: "Title", type: "text" },
      { key: "slug", title: "Slug", type: "text" },
      { key: "description", title: "Description", type: "richtext" },
      { key: "category", title: "Category", type: "text" },
      { key: "difficulty", title: "Difficulty", type: "enum", options: ["beginner", "intermediate", "advanced"] },
      { key: "course_type", title: "Type", type: "enum", options: ["certificates"] },
      { key: "duration_minutes", title: "Duration (Mins)", type: "number" },
      { key: "price", title: "Selling Price", type: "number" },
      { key: "original_price", title: "Original Price", type: "number" },
      { key: "is_published", title: "Published", type: "boolean" }
    ],
    actions: { create: true, edit: true, delete: true, duplicate: true, publish: true },
    bulkActions: { publish: true, delete: true, bulkPrice: true }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Manage Courses</h2>
      <GenericCRUDEngine config={config} data={courses || []} />
    </div>
  );
}
