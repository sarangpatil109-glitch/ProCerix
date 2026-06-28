import { createClient } from "@/lib/supabase/server";
import { EnrollmentService } from "@/services/enrollment-service";
import { PaymentService } from "@/services/payment-service";
import { createAdminClient } from "@/lib/supabase/admin";
import { ResumeService } from "@/services/resume-service";
import { LinkedInService } from "@/services/linkedin-service";
import { EnrollmentCard } from "@/components/dashboard/enrollment-card";
import Link from "next/link";
import { ArrowRight, Award, FileText, UserCircle, CreditCard } from "lucide-react";

export default async function DashboardHome() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const adminDb = createAdminClient();
  const [enrollments, payments, resumes, linkedInProfiles, { data: certificates }] = await Promise.all([
    EnrollmentService.getUserEnrollments(userId),
    PaymentService.getUserPayments(adminDb, userId),
    ResumeService.getUserResumes(userId).catch(() => []),
    LinkedInService.getUserProfiles(userId).catch(() => []),
    supabase.from("certificates").select("*, courses(title)").eq("user_id", userId).limit(3)
  ]);

  const activeEnrollments = enrollments?.filter(e => e.status !== 'completed' && (e.courses?.course_type === 'certificate' || e.courses?.course_type === 'internship')) || [];
  
  return (
    <div className="space-y-12 pb-20">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 sm:p-12 shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="relative z-10 space-y-4">
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
            Welcome to your ProCerix Hub.
          </h1>
          <p className="text-blue-100 text-lg md:text-xl max-w-2xl">
            Manage your courses, internships, certificates, and AI optimizations from one premium unified dashboard.
          </p>
        </div>
      </div>

      {/* Grid of Summaries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Learning Stats */}
        <Link href="/dashboard/courses" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-600 transition-colors" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{activeEnrollments.length}</h3>
          <p className="text-gray-500 font-medium">Active Courses</p>
        </Link>

        {/* Resumes */}
        <Link href="/dashboard/product/resume" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-purple-600 transition-colors" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{resumes.length}</h3>
          <p className="text-gray-500 font-medium">Resumes Built</p>
        </Link>

        {/* LinkedIn Profiles */}
        <Link href="/dashboard/product/linkedin" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl">
              <UserCircle className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{linkedInProfiles.length}</h3>
          <p className="text-gray-500 font-medium">Optimized Profiles</p>
        </Link>

        {/* Purchases */}
        <Link href="/dashboard/purchases" className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 transition-colors" />
          </div>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{payments?.length || 0}</h3>
          <p className="text-gray-500 font-medium">Purchases</p>
        </Link>

      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Continue Learning</h2>
          <Link href="/dashboard/courses" className="text-blue-600 dark:text-blue-400 font-semibold text-sm flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {activeEnrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeEnrollments.slice(0, 3).map((enrollment: any) => (
              <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-3xl">
            <p className="text-gray-500 dark:text-gray-400 mb-4">You have no active courses right now.</p>
            <Link href="/search" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors inline-block">
              Explore Catalog
            </Link>
          </div>
        )}
      </div>

    </div>
  );
}
