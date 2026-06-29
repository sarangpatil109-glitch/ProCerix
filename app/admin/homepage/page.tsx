import { createClient } from "@/lib/supabase/server";
import { HomepageForm } from "@/components/admin/settings/homepage-form";

export default async function HomepageCMSPage() {
  const supabase = await createClient();
  const { data: sections } = await supabase.from("homepage_sections").select("*").single();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Homepage CMS</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage the content and sections on the main landing page.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-5xl">
        <HomepageForm initialData={sections || {}} />
      </div>
    </div>
  );
}
