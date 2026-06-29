import { createAdminClient } from "@/lib/supabase/admin";
import { Award, Search } from "lucide-react";
import { GenericCRUDEngine } from "@/components/admin/crud-engine";

export default async function AdminCertificatesPage() {
  const supabase = createAdminClient();
  const { data: certs } = await supabase
    .from("certificates")
    .select("*, profiles(first_name, last_name), courses(title)")
    .order("issue_date", { ascending: false })
    .limit(50);

  const formattedCerts = (certs || []).map(c => ({
    ...c,
    user_name: `${c.profiles?.first_name || ''} ${c.profiles?.last_name || ''}`,
    course_name: c.courses?.title || 'Unknown',
    issue_date_formatted: new Date(c.issue_date).toLocaleDateString()
  }));

  const config = {
    entityName: "Certificate",
    tableName: "certificates",
    columns: [
      { key: "certificate_number", title: "Certificate ID", type: "text" },
      { key: "user_name", title: "User", type: "text" },
      { key: "course_name", title: "Course", type: "text" },
      { key: "issue_date_formatted", title: "Issue Date", type: "text" },
      { key: "status", title: "Status", type: "enum", options: ["valid", "revoked", "expired"] }
    ],
    actions: { create: true, edit: true, delete: true, duplicate: false, publish: false },
    primaryKey: "id"
  } as any;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Certificates</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Manage all issued credentials.</p>
      </div>
      <GenericCRUDEngine config={config} data={formattedCerts} />
    </div>
  );
}
