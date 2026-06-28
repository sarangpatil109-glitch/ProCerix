import { createClient } from "@/lib/supabase/server";
import { LinkedInService } from "@/services/linkedin-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserCircle, Plus, Trash2, Edit } from "lucide-react";

export default async function LinkedInDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const enrollments = await EnrollmentService.getUserEnrollments(user.id);
  const hasAccess = enrollments.some((e: any) => e.courses?.course_type === "linkedin");

  if (!hasAccess) {
    return (
      <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800">
        <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          You need to purchase the LinkedIn Profile Optimizer to optimize your profiles.
        </p>
        <Link href="/linkedin-optimizer" className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold">
          Get Access Now
        </Link>
      </div>
    );
  }

  const profiles = await LinkedInService.getUserProfiles(user.id);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">My LinkedIn Profiles</h1>
          <p className="text-gray-500 dark:text-gray-400">Optimize and manage your professional presence.</p>
        </div>
        <form action={async () => {
          "use server";
          const { createLinkedInAction } = await import("@/actions/linkedin");
          const supabase = await createClient();
          const { data: { user } } = await supabase.auth.getUser();
          const res = await createLinkedInAction(user!.id, "New Profile Optimization");
          if (res.success && res.profile) {
            redirect(`/dashboard/product/linkedin/${res.profile.id}`);
          }
        }}>
          <button type="submit" className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-colors">
            <Plus className="w-5 h-5" />
            Optimize New Profile
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profiles?.map(profile => (
          <div key={profile.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-48">
            <div className="flex items-start justify-between mb-auto">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600">
                  <UserCircle className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white truncate" title={profile.title}>{profile.title}</h3>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="text-sm font-medium text-gray-500">
                Strength: <span className={profile.profile_score > 70 ? "text-green-600" : "text-amber-600"}>{profile.profile_score}</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/dashboard/product/linkedin/${profile.id}`} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </Link>
                <form action={async () => {
                  "use server";
                  const { deleteLinkedInAction } = await import("@/actions/linkedin");
                  const supabase = await createClient();
                  const { data: { user } } = await supabase.auth.getUser();
                  await deleteLinkedInAction(profile.id, user!.id);
                }}>
                  <button type="submit" className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {(!profiles || profiles.length === 0) && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
            <p className="text-gray-500">No optimizations created yet. Click "Optimize New Profile" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
