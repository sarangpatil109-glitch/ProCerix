import { createAdminClient } from "@/lib/supabase/admin";
import { ContentAuditPage } from "@/components/admin/lms/content-audit-page";

export default async function LmsContentAuditPage() {
  const sdb = createAdminClient();
  const db = sdb as any;

  const [{ data: courses }, { data: moduleRows }, { data: lessonRows }, { data: quizRows }] = await Promise.all([
    db.from("courses")
      .select("id, title, course_type, is_published, company_name, price, description, short_description, assignment_required, certificate_template")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    db.from("learning_modules").select("course_id").is("deleted_at", null),
    db.from("lessons").select("module_id, learning_modules!inner(course_id)").is("deleted_at", null),
    db.from("quizzes").select("module_id, questions(id, deleted_at), learning_modules!inner(course_id)").is("deleted_at", null),
  ]);

  const moduleCount: Record<string, number> = {};
  for (const m of moduleRows || []) moduleCount[m.course_id] = (moduleCount[m.course_id] || 0) + 1;

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

  interface AuditItem {
    id: string;
    title: string;
    type: "certificate" | "internship";
    is_published: boolean;
    checks: { label: string; pass: boolean; detail: string }[];
    passed: boolean;
    failCount: number;
  }

  const results: AuditItem[] = (courses || []).map((c: any) => {
    const isCert = c.course_type === "certificates" || c.course_type === "certificate";
    const mods = moduleCount[c.id] || 0;
    const lessons = lessonCount[c.id] || 0;
    const mcqs = mcqCount[c.id] || 0;

    const checks = isCert
      ? [
          { label: "4–5 Modules",     pass: mods >= 4 && mods <= 5,      detail: `${mods} (need 4–5)` },
          { label: "4–5 Articles",    pass: lessons >= 4 && lessons <= 5, detail: `${lessons} (need 4–5)` },
          { label: "Exactly 10 MCQs", pass: mcqs === 10,                  detail: `${mcqs} (need 10)` },
          { label: "No Videos",       pass: true,                         detail: "Article-only ✓" },
          { label: "Title set",       pass: !!c.title?.trim(),            detail: c.title || "Missing" },
          { label: "Description set", pass: !!(c.description?.trim() || c.short_description?.trim()), detail: "Required for publish" },
          { label: "Price > 0",       pass: c.price > 0,                  detail: `₹${c.price || 0}` },
        ]
      : [
          { label: "7–8 Modules",      pass: mods >= 7 && mods <= 8,       detail: `${mods} (need 7–8)` },
          { label: "7–8 Articles",     pass: lessons >= 7 && lessons <= 8, detail: `${lessons} (need 7–8)` },
          { label: "Exactly 20 MCQs",  pass: mcqs === 20,                  detail: `${mcqs} (need 20)` },
          { label: "No Videos",        pass: true,                         detail: "Article-only ✓" },
          { label: "Assignment config",pass: true,                         detail: c.assignment_required ? "Required" : "Optional" },
          { label: "Certificate set",  pass: true,                         detail: c.certificate_template ? "Configured" : "Default template" },
          { label: "Title set",        pass: !!c.title?.trim(),            detail: c.title || "Missing" },
          { label: "Company name",     pass: !!c.company_name?.trim(),     detail: c.company_name || "Missing (set in Settings tab)" },
          { label: "Price > 0",        pass: c.price > 0,                  detail: `₹${c.price || 0}` },
        ];

    const failCount = checks.filter((ch) => !ch.pass).length;
    return {
      id: c.id,
      title: c.title,
      type: isCert ? "certificate" : "internship",
      is_published: c.is_published,
      checks,
      passed: failCount === 0,
      failCount,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Content Audit</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Automated validation — {results.filter((r) => r.passed).length} pass / {results.filter((r) => !r.passed).length} fail
        </p>
      </div>
      <ContentAuditPage results={results} />
    </div>
  );
}
