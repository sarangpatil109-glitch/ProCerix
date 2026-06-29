import { createClient } from "@/lib/supabase/server";
import { GenericCRUDEngine, CRUDConfig } from "@/components/admin/crud-engine";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function InternshipsCMSPage() {
  const supabase = await createClient();
  const { data: internships } = await supabase.from("internships").select("*").order("title", { ascending: true });

  const config: CRUDConfig = {
    entityName: "Internship",
    tableName: "internships",
    columns: [
      { key: "title", title: "Title", type: "text" }
    ],
    actions: { create: true, edit: true, delete: true },
    primaryKey: "id"
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Internships</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage virtual internships and their submissions.</p>
        </div>
        <Link href="/admin/internships/submissions" className="flex items-center gap-2 px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          View Submissions <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      
      <GenericCRUDEngine config={config} data={internships || []} />
    </div>
  );
}
