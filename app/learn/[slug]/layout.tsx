import { ReactNode } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourseService } from "@/services/course-service";
import { LearningService } from "@/services/learning-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { LearnSidebar } from "@/components/learn/learn-sidebar";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export default async function LearnLayout({
  params: paramsPromise,
  children,
}: {
  params: Promise<{ slug: string }>;
  children: ReactNode;
}) {
  const params = await paramsPromise;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  const userId = user.id;

  const adminDb = createAdminClient();
  const courseRepo = await CourseService.getRepository(adminDb);
  const course = await courseRepo.getCourseBySlug(params.slug).catch(() => null);

  if (!course) notFound();

  const enrollment = await EnrollmentService.checkAccess(userId, course.id).catch(() => null);
  if (!enrollment) redirect(`/course/${params.slug}`);

  const curriculum = await LearningService.getCourseContent(course.id, adminDb);
  const progress = await LearningService.getUserProgress(enrollment.id);

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] dark:bg-black selection:bg-blue-500/30">
      {/* Global site header — fixed, h-20 (5rem) */}
      <MarketingHeader />

      {/* Content area pushed below the fixed header */}
      <div className="flex flex-1 pt-20">
        {/* Sidebar: sticky so it stays in view while the main content scrolls */}
        <div className="hidden lg:block shrink-0 shadow-2xl z-10">
          <div className="sticky top-20 h-[calc(100vh-5rem)] overflow-y-auto">
            <LearnSidebar
              course={course}
              curriculum={curriculum}
              progress={progress}
              enrollmentId={enrollment.id}
            />
          </div>
        </div>

        {/* Main content — scrolls independently */}
        <main className="flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Global site footer */}
      <MarketingFooter />
    </div>
  );
}
