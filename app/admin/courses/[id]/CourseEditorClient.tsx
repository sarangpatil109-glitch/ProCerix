"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Globe, BookOpen, ClipboardList, Layers, CheckSquare } from "lucide-react";

export function CourseEditorClient({ course, curriculum, quizzes, tasks }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const router = useRouter();

  const safeCurriculum = Array.isArray(curriculum) ? curriculum : [];
  const totalArticles  = safeCurriculum.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);
  const totalModules   = safeCurriculum.length;

  let totalMCQs = 0;
  quizzes?.forEach((q: any) => { totalMCQs += q.questions?.length || 0; });

  const isCert       = course.course_type === "certificate" || course.course_type === "certificates";
  const isInternship = course.course_type === "internship";

  const validateForPublish = (): string | null => {
    if (isCert) {
      if (totalModules < 4 || totalModules > 5)  return "Certificate course must have 4–5 modules.";
      if (totalArticles < 4 || totalArticles > 5) return "Certificate course must have 4–5 articles (one per module).";
      if (totalMCQs !== 10)                       return "Certificate course must have exactly 10 MCQs in the final assessment.";
    } else if (isInternship) {
      if (totalModules < 5)                       return "Internship must have at least 5 modules.";
      if (totalArticles < 5)                      return "Internship must have at least 5 articles.";
      if (totalMCQs !== 10)                       return "Internship must have exactly 10 MCQs in the final quiz.";
      if ((tasks?.length ?? 0) < 1)               return "Internship must have at least 1 task (assignment/project).";
    }
    return null;
  };

  const handlePublish = async () => {
    setError(null);
    const validationError = validateForPublish();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "courses",
          action: "UPDATE",
          id: course.id,
          payload: { is_published: true },
        }),
      });
      if (!res.ok) throw new Error("Failed to publish course");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleUnpublish = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "courses",
          action: "UPDATE",
          id: course.id,
          payload: { is_published: false },
        }),
      });
      if (!res.ok) throw new Error("Failed to unpublish course");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  const certReq     = "4–5 modules, 1 article each, 10 MCQs";
  const internReq   = "5+ modules, 5+ articles, 10 MCQs, 1+ tasks";
  const requirement = isCert ? certReq : isInternship ? internReq : "—";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 capitalize mt-0.5">
            {course.course_type} · {course.is_published ? "Published" : "Draft"}
          </p>
          <p className="text-xs text-gray-400 mt-1">Required: {requirement}</p>
        </div>
        <div className="flex gap-4">
          {course.is_published ? (
            <button
              onClick={handleUnpublish}
              disabled={loading}
              className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors disabled:opacity-60"
            >
              Revert to Draft
            </button>
          ) : (
            <button
              onClick={handlePublish}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-60"
            >
              <Globe className="w-5 h-5" /> Publish Course
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Layers className="w-5 h-5 text-blue-500" />} label="Modules" value={totalModules} />
        <StatCard icon={<BookOpen className="w-5 h-5 text-emerald-500" />} label="Articles" value={totalArticles} />
        <StatCard icon={<ClipboardList className="w-5 h-5 text-orange-500" />} label="MCQs" value={totalMCQs} />
        {isInternship && (
          <StatCard icon={<CheckSquare className="w-5 h-5 text-purple-500" />} label="Tasks" value={tasks?.length ?? 0} />
        )}
      </div>

      {/* Curriculum outline */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Curriculum Outline</h2>
          <p className="text-gray-500 text-sm mt-1">
            Use the Modules and Learning Modules managers in the sidebar to edit content.
          </p>
        </div>

        <div className="space-y-4">
          {safeCurriculum.map((mod: any, index: number) => (
            <div key={mod.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/30">
              <h4 className="font-bold text-base text-gray-900 dark:text-white">
                Module {index + 1}: {mod.title}
              </h4>
              <ul className="mt-3 space-y-2 pl-4">
                {mod.lessons?.map((l: any, lIndex: number) => (
                  <li key={l.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    Article {lIndex + 1}: {l.title}
                    {l.estimated_reading_time && (
                      <span className="text-xs text-gray-400">· {l.estimated_reading_time} min</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
