import { createClient } from "@/lib/supabase/server";
import { CertificateSettingsForm } from "@/components/admin/settings/certificate-settings-form";

export default async function CertificateSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("certificate_settings").select("*").single();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Certificate Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage the appearance and generation of certificates.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 md:p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-4xl">
        <CertificateSettingsForm initialData={settings || {}} />
      </div>
    </div>
  );
}
