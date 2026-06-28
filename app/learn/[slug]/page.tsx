import { redirect, notFound } from "next/navigation";
import { CourseService } from "@/services/course-service";
import { LearningService } from "@/services/learning-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function LearnRedirectPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminDb = createAdminClient();
  const courseRepo = await CourseService.getRepository(adminDb);
  const course = await courseRepo.getCourseBySlug(params.slug).catch(() => null);

  if (!course) notFound();

  // Securely verify user has access to this course before showing content
  const enrollment = await EnrollmentService.checkAccess(user.id, course.id).catch(() => null);
  if (!enrollment) redirect(`/course/${params.slug}`);

  const curriculum = await LearningService.getCourseContent(course.id, adminDb);
  const progress = await LearningService.getUserProgress(enrollment.id);
  
  const allLessons = curriculum.flatMap((m: any) => m.lessons || []);
  let targetLessonId = allLessons[0]?.id;

  if (progress && progress.length > 0) {
    for (const lesson of allLessons) {
      const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.is_completed);
      if (!isCompleted) {
        targetLessonId = lesson.id;
        break;
      }
    }
    // If all completed, it stays as the first lesson, or we can set it to the last lesson:
    if (!targetLessonId && allLessons.length > 0) {
      targetLessonId = allLessons[allLessons.length - 1].id;
    }
  }

  if (targetLessonId) {
    redirect(`/learn/${params.slug}/${targetLessonId}`);
  } else {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-gray-500">
        This course doesn't have any lessons yet.
      </div>
    );
  }
}
