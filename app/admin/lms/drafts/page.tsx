import { createAdminClient } from "@/lib/supabase/admin";
import { LmsProductList } from "@/components/admin/lms/lms-product-list";
import Link from "next/link";

export default async function LmsDraftsPage() {
  const sdb = createAdminClient();
  const db = sdb as any;

  const [{ data: allCourses }, { data: lessonRows }, { data: quizRows }] = await Promise.all([
    db.from("courses")
      .select("id, title, slug, course_type, is_published, lms_status, price, original_price, category, difficulty, created_at, updated_at, thumbnail_url, is_featured")
      .is("deleted_at", null)
      .eq("is_published", false)
      .order("updated_at", { ascending: false }),
    db.from("lessons").select("module_id, learning_modules!inner(course_id)").is("deleted_at", null),
    db.from("quizzes").select("module_id, questions(id, deleted_at), learning_modules!inner(course_id)").is("deleted_at", null),
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

  const products = (allCourses || []).map((c: any) => ({
    ...c,
    modules: 0,
    lessons: lessonCount[c.id] || 0,
    mcqs: mcqCount[c.id] || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Drafts</h2>
          <p className="text-sm text-gray-500 mt-1">{products.length} unpublished product{products.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/lms/new" className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-blue-500/20">
          + New Product
        </Link>
      </div>
      <LmsProductList products={products} />
    </div>
  );
}
