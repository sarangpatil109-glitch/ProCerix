import { createClient } from "@/lib/supabase/server";
import { GenericCRUDEngine, CRUDConfig } from "@/components/admin/crud-engine";

export default async function AdminPrompts() {
  const supabase = await createClient();
  const { data: templates } = await supabase.from("prompt_templates").select("*").order("created_at", { ascending: false });

  const config: CRUDConfig = {
    entityName: "Prompt Template",
    tableName: "prompt_templates",
    columns: [
      { key: "name", title: "Name", type: "text" },
      { key: "type", title: "Type", type: "text" },
      { key: "description", title: "Description", type: "text" }
    ],
    actions: { create: true, edit: true, delete: true },
    customEditRoute: (id) => `/admin/prompts/${id}`
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">AI Prompt Templates</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage deterministic prompt structures to control generation quality.</p>
      </div>
      <GenericCRUDEngine config={config} data={templates || []} />
    </div>
  );
}
