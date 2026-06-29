import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourseService } from "@/services/course-service";
import { LearningService } from "@/services/learning-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { LearnSidebar } from "@/components/learn/learn-sidebar";

export default async function LearnLayout({ params: paramsPromise, children }: { params: Promise<{ slug: string  }>; children: ReactNode }) {
  const params = await paramsPromise;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Require authentication — never fall back to a demo ID
  if (!user) redirect("/login");
  const userId = user.id;

  // Use admin client so courses with is_published=false (AI-generated drafts,
  // seeded courses) are visible to enrolled users. Enrollment check below
  // enforces access control — the admin client is not a security bypass.
  const adminDb = createAdminClient();
  const courseRepo = await CourseService.getRepository(adminDb);
  const course = await courseRepo.getCourseBySlug(params.slug).catch(() => null);

  if (!course) notFound();

  // Validate enrollment before granting access to learning materials.
  const enrollment = await EnrollmentService.checkAccess(userId, course.id).catch(() => null);
  if (!enrollment) {
    redirect(`/course/${params.slug}`);
  }

  const curriculum = await LearningService.getCourseContent(course.id, adminDb);
  const progress = await LearningService.getUserProgress(enrollment.id);

  return (
    <div className="flex h-screen bg-[#FAFAFA] dark:bg-black selection:bg-blue-500/30 overflow-hidden">
      
      {/* Sidebar */}
      <div className="hidden lg:block h-full shadow-2xl z-10 shrink-0">
        <LearnSidebar 
          course={course} 
          curriculum={curriculum} 
          progress={progress} 
          enrollmentId={enrollment.id}
        />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto">
        {children}
      </main>

    </div>
  );
}
