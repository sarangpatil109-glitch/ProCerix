import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EnrollmentService } from "@/services/enrollment-service";
import { EnrollmentCard } from "@/components/dashboard/enrollment-card";

export default async function DashboardCourses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const adminDb = createAdminClient();
  const enrollments = await EnrollmentService.getUserEnrollments(userId, adminDb);
  const courses = enrollments?.filter(e => !e.courses?.course_type || e.courses?.course_type === 'certificate') || [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Courses</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage and track your active and completed certificate courses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {courses.map((enrollment: any) => (
          <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
        ))}
        {courses.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500">
            No courses found.
          </div>
        )}
      </div>
    </div>
  );
}
