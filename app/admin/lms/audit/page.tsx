import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle, Award, Briefcase } from "lucide-react";

interface AuditResult {
  id: string;
  title: string;
  type: "certificate" | "internship";
  is_published: boolean;
  checks: { label: string; pass: boolean }[];
  passed: boolean;
}

export default async function LmsAuditPage() {
  const db = createAdminClient();

  const [{ data: courses }, { data: moduleRows }, { data: lessonRows }, { data: quizRows }] = await Promise.all([
    db.from("courses").select("id, title, course_type, is_published, company_name, price, description, short_description").is("deleted_at", null).order("created_at", { ascending: false }),
    db.from("learning_modules").select("course_id").is("deleted_at", null),
    db.from("lessons").select("module_id, learning_modules!inner(course_id)").is("deleted_at", null),
    db.from("quizzes").select("module_id, questions(id, deleted_at), learning_modules!inner(course_id)").is("deleted_at", null),
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

  const results: AuditResult[] = (courses || []).map((c: any) => {
    const isCert = c.course_type === "certificates" || c.course_type === "certificate";
    const mods = moduleCount[c.id] || 0;
    const lessons = lessonCount[c.id] || 0;
    const mcqs = mcqCount[c.id] || 0;

    const checks = isCert
      ? [
          { label: `4–5 Modules (${mods})`, pass: mods >= 4 && mods <= 5 },
          { label: `4–5 Articles (${lessons})`, pass: lessons >= 4 && lessons <= 5 },
          { label: `10 MCQs (${mcqs})`, pass: mcqs === 10 },
          { label: "Has Title", pass: !!c.title?.trim() },
          { label: "Has Description", pass: !!(c.description?.trim() || c.short_description?.trim()) },
          { label: "Has Price", pass: c.price > 0 },
        ]
      : [
          { label: `7–8 Modules (${mods})`, pass: mods >= 7 && mods <= 8 },
          { label: `7–8 Articles (${lessons})`, pass: lessons >= 7 && lessons <= 8 },
          { label: `20 MCQs (${mcqs})`, pass: mcqs === 20 },
          { label: "Has Title", pass: !!c.title?.trim() },
          { label: "Has Description", pass: !!(c.description?.trim() || c.short_description?.trim()) },
          { label: "Has Price", pass: c.price > 0 },
          { label: "Company Name", pass: !!c.company_name?.trim() },
        ];

    return {
      id: c.id,
      title: c.title,
      type: isCert ? "certificate" : "internship",
      is_published: c.is_published,
      checks,
      passed: checks.every((ch) => ch.pass),
    };
  });

  const passed = results.filter((r) => r.passed);
  const failed = results.filter((r) => !r.passed);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Content Audit</h2>
        <p className="text-sm text-gray-500 mt-1">Automated validation for all products</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 text-center">
          <p className="text-3xl font-black text-gray-900 dark:text-white">{results.length}</p>
          <p className="text-xs text-gray-400 mt-1">Total Products</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-5 text-center">
          <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{passed.length}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">PASS</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-800 p-5 text-center">
          <p className="text-3xl font-black text-red-600 dark:text-red-400">{failed.length}</p>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">FAIL</p>
        </div>
      </div>

      {/* Failed first */}
      {failed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" />Needs Attention ({failed.length})
          </h3>
          <div className="space-y-3">
            {failed.map((r) => (
              <Link key={r.id} href={`/admin/lms/${r.id}?tab=audit`}
                className="block bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900 rounded-2xl p-5 hover:border-red-400 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${r.type === "certificate" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-purple-50 dark:bg-purple-900/20"}`}>
                    {r.type === "certificate" ? <Award className="w-4 h-4 text-amber-500" /> : <Briefcase className="w-4 h-4 text-purple-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900 dark:text-white">{r.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{r.type} · {r.is_published ? "Published" : "Draft"}</p>
                  </div>
                  <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2.5 py-1 rounded-full">FAIL</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.checks.map((ch, i) => (
                    <span key={i} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg ${ch.pass ? "bg-gray-50 dark:bg-gray-800 text-gray-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"}`}>
                      {ch.pass ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}{ch.label}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Passed */}
      {passed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />All Checks Passed ({passed.length})
          </h3>
          <div className="space-y-2">
            {passed.map((r) => (
              <Link key={r.id} href={`/admin/lms/${r.id}`}
                className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-5 py-3.5 hover:border-emerald-300 transition-colors">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <div className="flex items-center gap-2 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{r.title}</p>
                  <span className="text-xs text-gray-400 capitalize">{r.type}</span>
                  {r.is_published && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Live</span>}
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full">PASS</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {results.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-200 dark:text-gray-700" />
          <p className="text-sm">No products to audit yet.</p>
        </div>
      )}
    </div>
  );
}
