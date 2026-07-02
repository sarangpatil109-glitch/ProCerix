import { createAdminClient } from "@/lib/supabase/admin";
import { TemplatesManager } from "@/components/admin/lms/templates-manager";

export default async function LmsTemplatesPage() {
  const sdb = createAdminClient();
  const db = sdb as any;

  const { data: templates } = await db
    .from("lms_templates")
    .select("*")
    .order("created_at", { ascending: false });

  const normalized = (templates || []).map((t: any) => ({
    id: t.id,
    name: t.name,
    type: t.type,
    content: t.content,
    variables: t.variables ?? null,
    preview_url: t.preview_url ?? null,
    is_default: t.is_default ?? false,
    created_at: t.created_at,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Templates</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {normalized.length} templates — Certificate and internship letter templates
        </p>
      </div>
      <TemplatesManager initialTemplates={normalized} />
    </div>
  );
}
