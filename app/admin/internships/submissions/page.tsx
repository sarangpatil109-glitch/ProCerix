import { createClient } from "@/lib/supabase/server";
import { CheckCircle, XCircle } from "lucide-react";
import { revalidatePath } from "next/cache";
import { updateSubmissionStatus } from "@/actions/admin/internships";

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const { data: rawSubmissions } = await supabase
    .from("internship_submissions")
    .select("*, profiles(first_name, last_name, email), internship_tasks(title, internships(title))")
    .order("created_at", { ascending: false });
    
  const submissions = rawSubmissions as any[] | null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Task Submissions</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Approve or reject internship task submissions.</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Task & Internship</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {submissions?.map(sub => (
              <tr key={sub.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 dark:text-white">
                    {sub.profiles?.first_name} {sub.profiles?.last_name}
                  </div>
                  <div className="text-xs text-gray-500">{sub.profiles?.email || "No email"}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900 dark:text-white">{sub.internship_tasks?.title}</div>
                  <div className="text-xs text-gray-500">{sub.internship_tasks?.internships?.title}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    sub.status === 'approved' ? 'bg-green-100 text-green-800' :
                    sub.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sub.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                  <form action={async () => {
                    "use server";
                    await updateSubmissionStatus(sub.id, "approved");
                    revalidatePath("/admin/internships/submissions");
                  }}>
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve">
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  </form>
                  <form action={async () => {
                    "use server";
                    await updateSubmissionStatus(sub.id, "rejected");
                    revalidatePath("/admin/internships/submissions");
                  }}>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(!submissions || submissions.length === 0) && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  No submissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
