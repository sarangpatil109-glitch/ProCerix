import { createAdminClient } from "@/lib/supabase/admin";
import { TemplatesManager } from "@/components/admin/lms/templates-manager";

export default async function LmsTemplatesPage() {
  const db = createAdminClient();
  const { data: templates } = await db
    .from("lms_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Templates</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Certificate and letter templates</p>
      </div>
      <TemplatesManager initialTemplates={templates || []} />
    </div>
  );
}
