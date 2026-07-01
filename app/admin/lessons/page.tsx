import { createAdminClient } from "@/lib/supabase/admin";
import { GenericCRUDEngine, CRUDConfig } from "@/components/admin/crud-engine";

export default async function AdminLessons() {
  const supabase = createAdminClient();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .order("created_at", { ascending: false });

  const config: CRUDConfig = {
    entityName: "Learning Module",
    tableName: "lessons",
    columns: [
      { key: "title",                   title: "Article Title",      type: "text"     },
      { key: "module_id",               title: "Module ID",          type: "text"     },
      { key: "sequence_order",          title: "Order",              type: "number"   },
      { key: "estimated_reading_time",  title: "Reading Time (min)", type: "number"   },
      { key: "content",                 title: "Article Content",    type: "richtext" },
    ],
    actions: { create: true, edit: true, delete: true },
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
        Manage Learning Modules
      </h2>
      <GenericCRUDEngine config={config} data={lessons || []} />
    </div>
  );
}
