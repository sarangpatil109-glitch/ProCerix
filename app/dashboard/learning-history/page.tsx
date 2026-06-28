import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EnrollmentService } from "@/services/enrollment-service";
import { redirect } from "next/navigation";
import { BookOpen, CheckCircle2, History } from "lucide-react";
import Link from "next/link";

export default async function LearningHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminDb = createAdminClient();
  const enrollments = await EnrollmentService.getUserEnrollments(user.id, adminDb);
  const completed = enrollments?.filter(e => e.status === "completed") || [];
  const inProgress = enrollments?.filter(e => e.status !== "completed") || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Learning History
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
          Track your progress, view completed courses, and check assessment scores.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Completed Courses */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Completed Courses</h2>
          </div>
          <div className="space-y-4">
            {completed.map((enrollment: any) => (
              <div key={enrollment.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-bold text-gray-900 dark:text-white">{enrollment.courses?.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-gray-500 capitalize">{enrollment.courses?.course_type}</span>
                  <Link href={`/dashboard/certificates`} className="text-sm text-blue-600 font-bold hover:underline">
                    View Certificate
                  </Link>
                </div>
              </div>
            ))}
            {completed.length === 0 && (
              <p className="text-gray-500 text-center py-4">No completed courses yet.</p>
            )}
          </div>
        </section>

        {/* Recently Viewed / In Progress */}
        <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recently Viewed</h2>
          </div>
          <div className="space-y-4">
            {inProgress.slice(0, 5).map((enrollment: any) => (
              <div key={enrollment.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-bold text-gray-900 dark:text-white">{enrollment.courses?.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex-1 mr-4">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${enrollment.progress || 0}%` }}></div>
                    </div>
                  </div>
                  <Link href={`/learn/${enrollment.courses?.slug}`} className="text-sm text-blue-600 font-bold hover:underline shrink-0">
                    Continue Learning
                  </Link>
                </div>
              </div>
            ))}
            {inProgress.length === 0 && (
              <p className="text-gray-500 text-center py-4">No active courses.</p>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}
