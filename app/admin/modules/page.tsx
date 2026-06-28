import { createClient } from "@/lib/supabase/server";
import { GenericCRUDEngine, CRUDConfig } from "@/components/admin/crud-engine";

export default async function AdminModules() {
  const supabase = await createClient();
  const { data: modules } = await supabase.from("learning_modules").select("*").order("created_at", { ascending: false });

  const config: CRUDConfig = {
    entityName: "Module",
    tableName: "learning_modules",
    columns: [
      { key: "title", title: "Title", type: "text" },
      { key: "course_id", title: "Course ID", type: "text" },
      { key: "sequence_order", title: "Order", type: "number" }
    ],
    actions: { create: true, edit: true, delete: true }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Manage Modules</h2>
      <GenericCRUDEngine config={config} data={modules || []} />
    </div>
  );
}
