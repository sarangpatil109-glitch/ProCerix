import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { BuilderClient } from "@/components/admin/lms/builder-client";

export default async function LmsBuilderPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const sdb = createAdminClient();
  const db = sdb as any;

  const { data: course } = await db.from("courses").select("*").eq("id", params.id).is("deleted_at", null).single();
  if (!course) notFound();

  // Fetch modules with lessons
  const { data: modules } = await db
    .from("learning_modules")
    .select("*, lessons(*)")
    .eq("course_id", params.id)
    .is("deleted_at", null)
    .order("sequence_order");

  // Sort lessons within each module
  const sortedModules = (modules || []).map((m: any) => ({
    ...m,
    lessons: ((m.lessons || []) as any[])
      .filter((l: any) => !l.deleted_at)
      .sort((a: any, b: any) => a.sequence_order - b.sequence_order),
  }));

  // Fetch quizzes with questions and options
  const moduleIds = sortedModules.map((m: any) => m.id);
  let quizzes: any[] = [];
  if (moduleIds.length > 0) {
    const { data: qzData } = await db
      .from("quizzes")
      .select("*, questions(*, options(*))")
      .in("module_id", moduleIds)
      .is("deleted_at", null);
    quizzes = (qzData || []).map((qz: any) => ({
      ...qz,
      questions: ((qz.questions || []) as any[])
        .filter((q: any) => !q.deleted_at)
        .sort((a: any, b: any) => a.sequence_order - b.sequence_order),
    }));
  }

  return (
    <BuilderClient
      course={course as any}
      initialModules={sortedModules as any}
      initialQuizzes={quizzes as any}
    />
  );
}
