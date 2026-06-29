import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CourseService } from "@/services/course-service";
import { LearningService } from "@/services/learning-service";
import { EnrollmentService } from "@/services/enrollment-service";
import { QuizPlayer } from "@/components/learn/quiz-player";

export default async function QuizPage(props: {
  params: Promise<{ slug: string; quizId: string }>;
}) {
  const params = await props.params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminDb = createAdminClient();

  const courseRepo = await CourseService.getRepository(adminDb);
  const course = await courseRepo.getCourseBySlug(params.slug).catch(() => null);
  if (!course) notFound();

  const enrollment = await EnrollmentService.checkAccess(user.id, course.id).catch(() => null);
  if (!enrollment) redirect(`/course/${params.slug}`);

  // Load quiz with questions and their options (admin client bypasses RLS on quizzes/questions/options)
  const { data: quiz, error: quizError } = await (adminDb as any)
    .from("quizzes")
    .select("*, questions(*, options(*))")
    .eq("id", params.quizId)
    .is("deleted_at", null)
    .maybeSingle();

  if (quizError || !quiz) notFound();

  // Sort questions by sequence_order
  quiz.questions = [...(quiz.questions || [])].sort(
    (a: any, b: any) => a.sequence_order - b.sequence_order,
  );

  // Find which module this quiz belongs to, then determine the next module's first lesson
  const curriculum = await LearningService.getCourseContent(course.id, adminDb);
  const moduleIndex = curriculum.findIndex((m: any) => m.id === quiz.module_id);
  const nextModule: any = moduleIndex >= 0 ? curriculum[moduleIndex + 1] ?? null : null;
  const nextLessonId: string | null = nextModule?.lessons?.[0]?.id ?? null;
  const isLastModule = nextModule === null;

  // Check for a previous attempt so the player can show "already passed" status
  const { data: previousAttemptRaw } = await (supabase as any)
    .from("attempts")
    .select("id, score, status, completed_at")
    .eq("enrollment_id", enrollment.id)
    .eq("quiz_id", params.quizId)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const previousAttempt = (previousAttemptRaw ?? null) as {
    id: string; score: number | null; status: string; completed_at: string | null;
  } | null;

  return (
    <div className="min-h-full py-8 md:py-12 px-4 sm:px-6 lg:px-12">
      <QuizPlayer
        quiz={quiz}
        courseSlug={params.slug}
        enrollmentId={enrollment.id}
        nextLessonId={nextLessonId}
        isLastModule={isLastModule}
        userId={user.id}
        courseId={course.id}
        previousAttempt={previousAttempt}
      />
    </div>
  );
}
