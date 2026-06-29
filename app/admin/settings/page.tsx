import { createAdminClient } from "@/lib/supabase/admin";
import { SiteSettingsForm } from "@/components/admin/settings/site-settings-form";

export default async function SettingsPage() {
  const supabase = createAdminClient();
  const { data: settings } = await supabase.from("site_settings").select("*").single();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Site Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage global configuration for ProCerix.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-4xl">
        <SiteSettingsForm initialData={settings || {}} />
      </div>
    </div>
  );
}
