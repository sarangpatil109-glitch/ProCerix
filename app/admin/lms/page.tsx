import { createAdminClient } from "@/lib/supabase/admin";
import { LmsDashboard } from "@/components/admin/lms/lms-dashboard";

export default async function AdminLmsPage() {
  const db = createAdminClient();

  const [
    { data: allCourses },
    { data: moduleRows },
    { data: lessonRows },
    { data: quizRows },
    { data: enrollments },
  ] = await Promise.all([
    db.from("courses").select("id, title, slug, course_type, is_published, lms_status, updated_at, created_at").is("deleted_at", null).order("updated_at", { ascending: false }),
    db.from("learning_modules").select("course_id").is("deleted_at", null),
    db.from("lessons").select("module_id, learning_modules!inner(course_id)").is("deleted_at", null),
    db.from("quizzes").select("module_id, questions(id, deleted_at), learning_modules!inner(course_id)").is("deleted_at", null),
    db.from("enrollments").select("course_id, amount_paid"),
  ]);

  const moduleCount: Record<string, number> = {};
  for (const m of moduleRows || []) moduleCount[m.course_id] = (moduleCount[m.course_id] || 0) + 1;

  const lessonCount: Record<string, number> = {};
  for (const l of lessonRows || []) {
    const cid = (l.learning_modules as any)?.course_id;
    if (cid) lessonCount[cid] = (lessonCount[cid] || 0) + 1;
  }

  const mcqCount: Record<string, number> = {};
  for (const q of quizRows || []) {
    const cid = (q.learning_modules as any)?.course_id;
    if (!cid) continue;
    const active = ((q.questions as any[]) || []).filter((qn: any) => !qn.deleted_at);
    mcqCount[cid] = (mcqCount[cid] || 0) + active.length;
  }

  const courses = allCourses || [];
  const isCert = (c: any) => c.course_type === "certificates" || c.course_type === "certificate";

  const stats = {
    total: courses.length,
    certificates: courses.filter(isCert).length,
    internships: courses.filter((c: any) => !isCert(c)).length,
    published: courses.filter((c: any) => c.is_published).length,
    draft: courses.filter((c: any) => !c.is_published).length,
    totalStudents: (enrollments || []).length,
    totalRevenue: (enrollments || []).reduce((a: number, e: any) => a + (e.amount_paid || 0), 0),
  };

  // Detect audit issues (drafts with problems or published but failing validation)
  const auditIssues: any[] = [];
  for (const c of courses.slice(0, 10)) {
    const mods = moduleCount[c.id] || 0;
    const lessons = lessonCount[c.id] || 0;
    const mcqs = mcqCount[c.id] || 0;
    if (isCert(c)) {
      if (mods < 4 || mods > 5) auditIssues.push({ ...c, reason: `${mods} modules (need 4–5)` });
      else if (mcqs !== 10) auditIssues.push({ ...c, reason: `${mcqs} MCQs (need exactly 10)` });
    } else {
      if (mods < 7 || mods > 8) auditIssues.push({ ...c, reason: `${mods} modules (need 7–8)` });
      else if (mcqs !== 20) auditIssues.push({ ...c, reason: `${mcqs} MCQs (need exactly 20)` });
    }
    if (auditIssues.length >= 5) break;
  }

  return (
    <div className="p-0">
      <LmsDashboard
        stats={stats}
        recentProducts={courses.slice(0, 6)}
        auditIssues={auditIssues}
      />
    </div>
  );
}
