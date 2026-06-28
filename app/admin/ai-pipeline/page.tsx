import { createClient } from "@/lib/supabase/server";
import { AIPipelineService } from "@/services/ai-pipeline-service";
import { Bot, RefreshCcw, XCircle, FileText, CheckCircle2, AlertCircle, Clock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export default async function AdminAIPipelinePage() {
  const supabase = await createClient();
  const stats = await AIPipelineService.getPipelineStats();

  const { data: queue } = await supabase
    .from("generation_queue")
    .select("*, profiles(first_name, last_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  // Server Actions for Recovery
  async function retryJob(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await AIPipelineService.retryFailedJob(id);
    revalidatePath("/admin/ai-pipeline");
  }

  async function cancelJob(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await AIPipelineService.cancelJob(id);
    revalidatePath("/admin/ai-pipeline");
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Automation Pipeline</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Monitor and manage course generation workers.</p>
        </div>
        <form action={async () => {
          "use server";
          await AIPipelineService.processQueue();
          revalidatePath("/admin/ai-pipeline");
        }}>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold shadow-sm transition-colors">
            <PlayCircle className="w-5 h-5" /> Force Run Worker
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center text-center">
          <Clock className="w-8 h-8 text-amber-500 mb-2" />
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats.pending}</h3>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pending</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-blue-200 dark:border-blue-900/50 flex flex-col items-center justify-center text-center">
          <Bot className="w-8 h-8 text-blue-500 mb-2" />
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats.processing}</h3>
          <p className="text-sm font-medium text-blue-500 uppercase tracking-wide">Processing</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-purple-200 dark:border-purple-900/50 flex flex-col items-center justify-center text-center">
          <FileText className="w-8 h-8 text-purple-500 mb-2" />
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats.review}</h3>
          <p className="text-sm font-medium text-purple-500 uppercase tracking-wide">Needs Review</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-green-200 dark:border-green-900/50 flex flex-col items-center justify-center text-center">
          <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats.completed}</h3>
          <p className="text-sm font-medium text-green-500 uppercase tracking-wide">Published</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-red-200 dark:border-red-900/50 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats.failed}</h3>
          <p className="text-sm font-medium text-red-500 uppercase tracking-wide">Failed</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">Recent Generations</h3>
        </div>
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-900 dark:text-white font-medium border-b border-gray-200 dark:border-gray-800">
            <tr>
              <th className="px-6 py-4">Skill Target</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Requester</th>
              <th className="px-6 py-4">Timeline</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {queue?.map(job => (
              <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                  {job.skill_name}
                  {job.error_message && (
                    <p className="text-xs text-red-500 mt-1 font-normal max-w-xs truncate" title={job.error_message}>{job.error_message}</p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    job.status === 'review' ? 'bg-purple-100 text-purple-800' :
                    job.status === 'completed' ? 'bg-green-100 text-green-800' :
                    job.status === 'failed' ? 'bg-red-100 text-red-800' :
                    job.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    job.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {job.profiles ? `${job.profiles.first_name} ${job.profiles.last_name}` : "System"}
                </td>
                <td className="px-6 py-4 text-xs">
                  <div className="space-y-1">
                    <div><span className="text-gray-400">Created:</span> {new Date(job.created_at).toLocaleTimeString()}</div>
                    {job.completed_at && <div><span className="text-gray-400">Finished:</span> {new Date(job.completed_at).toLocaleTimeString()}</div>}
                  </div>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {job.status === 'failed' && (
                    <form action={retryJob}>
                      <input type="hidden" name="id" value={job.id} />
                      <button type="submit" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip" title="Retry">
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                  {['pending', 'processing'].includes(job.status) && (
                    <form action={cancelJob}>
                      <input type="hidden" name="id" value={job.id} />
                      <button type="submit" className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip" title="Cancel">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                  {['review', 'completed'].includes(job.status) && job.course_id && (
                    <Link href={`/admin/courses/${job.course_id}`} className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors tooltip" title="Open Draft">
                      <FileText className="w-4 h-4" />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {(!queue || queue.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  No generation requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
