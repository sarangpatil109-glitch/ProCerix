import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { EnrollmentService } from "@/services/enrollment-service";
import { EnrollmentCard } from "@/components/dashboard/enrollment-card";

export default async function DashboardInternships() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user!.id;

  const adminDb = createAdminClient();
  const enrollments = await EnrollmentService.getUserEnrollments(userId, adminDb);
  const internships = enrollments?.filter(e => e.courses?.course_type === 'internship') || [];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Internships</h1>
        <p className="text-gray-500 dark:text-gray-400">Complete tasks and build real-world experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {internships.map((enrollment: any) => (
          <EnrollmentCard key={enrollment.id} enrollment={enrollment} />
        ))}
        {internships.length === 0 && (
          <div className="col-span-full p-8 text-center text-gray-500">
            No internships found.
          </div>
        )}
      </div>
    </div>
  );
}
