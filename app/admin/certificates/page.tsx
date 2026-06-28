import { createClient } from "@/lib/supabase/server";
import { Award, Search } from "lucide-react";

export default async function AdminCertificatesPage() {
  const supabase = await createClient();
  const { data: certs } = await supabase
    .from("certificates")
    .select("*, profiles(first_name, last_name), courses(title)")
    .order("issue_date", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Certificates</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Manage all issued credentials.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search by ID..." className="pl-10 pr-4 py-2 border rounded-full bg-white dark:bg-gray-900 dark:border-gray-800" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4">Certificate ID</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Issue Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {certs?.map(cert => (
              <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-mono text-xs">{cert.certificate_number}</div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {cert.profiles?.first_name} {cert.profiles?.last_name}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {cert.courses?.title || "Unknown"}
                </td>
                <td className="px-6 py-4">
                  {new Date(cert.issue_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-3">
                  <button className="text-sm text-blue-600 font-medium hover:underline">Verify</button>
                  <button className="text-sm text-red-600 font-medium hover:underline">Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
