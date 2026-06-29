import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourseService } from "@/services/course-service";
import { LearningService } from "@/services/learning-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { LessonViewer } from "@/components/learn/lesson-viewer";
import { LessonNavigation } from "@/components/learn/lesson-navigation";

export default async function LessonPage(props: { params: Promise<{ slug: string, lessonId: string }> }) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
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

  // Flat array for global prev/next navigation buttons
  const allLessons = curriculum.flatMap((m: any) => (m.lessons || []) as any[]);
  const currentIndex = allLessons.findIndex((l: any) => l.id === params.lessonId);

  if (currentIndex === -1) notFound();

  const currentLesson = allLessons[currentIndex];
  const prevLessonId = currentIndex > 0 ? allLessons[currentIndex - 1].id : null;
  const nextLessonId = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1].id : null;

  // Determine if this lesson is the last in its module and if that module has a quiz.
  // Used to route the user to the module quiz instead of the next lesson on completion.
  const currentModule = curriculum.find((m: any) =>
    (m.lessons || []).some((l: any) => l.id === params.lessonId)
  ) as any;
  const moduleLessons: any[] = currentModule?.lessons || [];
  const lessonIndexInModule = moduleLessons.findIndex((l: any) => l.id === params.lessonId);
  const isLastInModule = lessonIndexInModule === moduleLessons.length - 1;
  const moduleQuizId: string | null = isLastInModule
    ? ((currentModule?.quizzes as any[] | undefined)?.find((q: any) => !q.deleted_at)?.id ?? null)
    : null;

  const isCompleted = progress.some((p: any) => p.lesson_id === currentLesson.id && p.is_completed);

  return (
    <div className="min-h-full py-8 md:py-12 px-4 sm:px-6 lg:px-12 flex flex-col">
      <div className="flex-1">
        <LessonViewer lesson={currentLesson} />
      </div>
      
      <div className="max-w-4xl mx-auto w-full mt-auto">
        <LessonNavigation
          courseSlug={course.slug}
          enrollmentId={enrollment.id}
          lessonId={currentLesson.id}
          isCompleted={isCompleted}
          prevLessonId={prevLessonId}
          nextLessonId={nextLessonId}
          moduleQuizId={moduleQuizId}
          userId={userId}
          courseId={course.id}
        />
      </div>
    </div>
  );
}
