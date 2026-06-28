import { ReactNode } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CourseService } from "@/services/course-service";
import { LearningService } from "@/services/learning-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { LearnSidebar } from "@/components/learn/learn-sidebar";

export default async function LearnLayout(props: { params: Promise<{ slug: string  }>; children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id || "demo-user-id";

  const courseRepo = await CourseService.getRepository();
  const course = await courseRepo.getCourseBySlug(params.slug).catch(() => null);

  if (!course) notFound();

  // Validate Enrollment explicitly before granting access to learning materials
  const enrollment = await EnrollmentService.checkAccess(userId, course.id).catch(() => null);
  if (!enrollment) {
    redirect(`/course/${params.slug}`);
  }

  const curriculum = await LearningService.getCourseContent(course.id);
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
