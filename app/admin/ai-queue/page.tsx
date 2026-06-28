import { createClient } from "@/lib/supabase/server";
import { Cpu, Search } from "lucide-react";

export default async function AdminAiQueuePage() {
  const supabase = await createClient();
  const { data: queue } = await supabase
    .from("generation_queue")
    .select("*, profiles(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Generations</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Monitor AI content generation queue.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search skill..." className="pl-10 pr-4 py-2 border rounded-full bg-white dark:bg-gray-900 dark:border-gray-800" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4">Skill</th>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {queue?.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                  {item.skill_name}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {item.profiles?.first_name} {item.profiles?.last_name}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    item.status === 'completed' ? 'bg-green-100 text-green-800' :
                    item.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(item.created_at).toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right">
                  {item.status === 'failed' && (
                    <button className="text-sm text-blue-600 font-medium hover:underline">Retry</button>
                  )}
                  {item.status === 'completed' && item.course_id && (
                    <button className="text-sm text-purple-600 font-medium hover:underline">View Draft</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
