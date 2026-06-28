import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PromptVersionClient } from "./PromptVersionClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PromptVersionPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!template) return notFound();

  const { data: versions } = await supabase
    .from("prompt_versions")
    .select("*")
    .eq("template_id", params.id)
    .order("version_number", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/prompts" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{template.name}</h2>
          <p className="text-gray-500 dark:text-gray-400">Manage versions and test variables for {template.type} prompts.</p>
        </div>
      </div>

      <PromptVersionClient template={template} initialVersions={versions || []} />
    </div>
  );
}
