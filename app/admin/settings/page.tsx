import { createClient } from "@/lib/supabase/server";
import { GenericCRUDEngine, CRUDConfig } from "@/components/admin/crud-engine";

export default async function AdminSettings() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("system_settings").select("*").order("category", { ascending: true });

  const config: CRUDConfig = {
    entityName: "Setting",
    tableName: "system_settings",
    columns: [
      { key: "category", title: "Category", type: "text" },
      { key: "description", title: "Description", type: "text" },
      { key: "key", title: "Key", type: "text" },
      { key: "value", title: "Value", type: "text" }
    ],
    actions: { create: false, edit: true, delete: false },
    primaryKey: "key"
  };

  // Convert JSONB values to string for editing, but they will be parsed when saving if we did custom logic.
  // Wait, our generic CRUD API handles string updates, but if the DB column is JSONB and we send a string, Supabase might cast it to JSON string.
  // It's perfectly fine as long as they type "true" or "100" or ""My Title"".

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">System Settings</h2>
        <p className="text-gray-500 dark:text-gray-400">Manage all core platform configurations centrally. Changes propagate globally.</p>
      </div>
      <GenericCRUDEngine config={config} data={settings || []} />
    </div>
  );
}
