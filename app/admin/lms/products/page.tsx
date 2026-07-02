import { createAdminClient } from "@/lib/supabase/admin";
import { LmsProductList } from "@/components/admin/lms/lms-product-list";
import Link from "next/link";

export default async function LmsProductsPage() {
  const db = createAdminClient();

  const [
    { data: allCourses },
    { data: moduleRows },
    { data: lessonRows },
    { data: quizRows },
    { data: enrollmentRows },
  ] = await Promise.all([
    db.from("courses").select("id, title, slug, course_type, is_published, lms_status, price, original_price, category, difficulty, created_at, updated_at, thumbnail_url, is_featured, is_trending").is("deleted_at", null).order("created_at", { ascending: false }),
    db.from("learning_modules").select("course_id").is("deleted_at", null),
    db.from("lessons").select("module_id, learning_modules!inner(course_id)").is("deleted_at", null),
    db.from("quizzes").select("module_id, questions(id, deleted_at), learning_modules!inner(course_id)").is("deleted_at", null),
    db.from("enrollments").select("course_id"),
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

  const enrollCount: Record<string, number> = {};
  for (const e of enrollmentRows || []) {
    enrollCount[(e as any).course_id] = (enrollCount[(e as any).course_id] || 0) + 1;
  }

  const products = (allCourses || []).map((c: any) => ({
    ...c,
    modules: moduleCount[c.id] || 0,
    lessons: lessonCount[c.id] || 0,
    mcqs: mcqCount[c.id] || 0,
    enrollments: enrollCount[c.id] || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">All Products</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {products.length} product{products.length !== 1 ? "s" : ""} · Certificates & Virtual Internships
          </p>
        </div>
        <Link
          href="/admin/lms/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20 text-sm"
        >
          + New Product
        </Link>
      </div>
      <LmsProductList products={products} />
    </div>
  );
}
