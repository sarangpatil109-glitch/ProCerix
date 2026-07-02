import { createAdminClient } from "@/lib/supabase/admin";
import { CertificatesList } from "@/components/admin/lms/certificates-list";

export default async function LmsCertificatesPage() {
  const sdb = createAdminClient();
  const db = sdb as any;

  const [
    { data: courses },
    { data: lessonRows },
    { data: quizRows },
    { data: enrollmentRows },
  ] = await Promise.all([
    db.from("courses")
      .select("id, title, slug, is_published, is_featured, price, original_price, category, difficulty, thumbnail_url, passing_percentage, validity_period, certificate_template")
      .is("deleted_at", null)
      .in("course_type", ["certificates", "certificate"])
      .order("created_at", { ascending: false }),
    db.from("lessons").select("module_id, learning_modules!inner(course_id)").is("deleted_at", null),
    db.from("quizzes").select("module_id, questions(id, deleted_at), learning_modules!inner(course_id)").is("deleted_at", null),
    db.from("enrollments").select("course_id"),
  ]);

  const lessonCount: Record<string, number> = {};
  for (const l of lessonRows || []) {
    const cid = l?.learning_modules?.course_id;
    if (cid) lessonCount[cid] = (lessonCount[cid] || 0) + 1;
  }

  const mcqCount: Record<string, number> = {};
  for (const q of quizRows || []) {
    const cid = q?.learning_modules?.course_id;
    if (!cid) continue;
    const active = (q.questions || []).filter((qn: any) => !qn.deleted_at);
    mcqCount[cid] = (mcqCount[cid] || 0) + active.length;
  }

  const enrollCount: Record<string, number> = {};
  for (const e of enrollmentRows || []) {
    enrollCount[e.course_id] = (enrollCount[e.course_id] || 0) + 1;
  }

  const products = (courses || []).map((c: any) => ({
    ...c,
    lessons: lessonCount[c.id] || 0,
    mcqs: mcqCount[c.id] || 0,
    enrollments: enrollCount[c.id] || 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Certificates</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {products.length} certificate product{products.length !== 1 ? "s" : ""} · Click Edit to manage modules, quiz and settings
        </p>
      </div>
      <CertificatesList products={products} />
    </div>
  );
}
