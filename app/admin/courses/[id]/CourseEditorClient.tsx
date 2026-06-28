"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Globe } from "lucide-react";

export function CourseEditorClient({ course, curriculum, quizzes, tasks }: any) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const totalLessons = curriculum.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0);
  const totalModules = curriculum.length;
  
  let totalMCQs = 0;
  quizzes?.forEach((q: any) => {
    totalMCQs += q.questions?.length || 0;
  });

  const validateForPublish = () => {
    if (course.course_type === "certificate") {
      if (totalModules < 2 || totalModules > 3) return "Certificate course must have 2-3 modules.";
      if (totalLessons < 5 || totalLessons > 8) return "Certificate course must have 5-8 lessons.";
      if (totalMCQs !== 10) return "Certificate course must have exactly 10 MCQs.";
    } else if (course.course_type === "internship") {
      if (totalModules < 2 || totalModules > 5) return "Internship course must have 2-5 modules.";
      if (totalLessons < 10 || totalLessons > 15) return "Internship course must have 10-15 lessons.";
      if (totalMCQs !== 10) return "Internship course must have exactly 10 MCQs.";
      if (tasks.length !== 3) return "Internship course must have exactly 3 tasks.";
    }
    return null;
  };

  const handlePublish = async () => {
    setError(null);
    const validationError = validateForPublish();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "courses",
          action: "UPDATE",
          id: course.id,
          payload: { is_published: true }
        })
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
          payload: { is_published: false }
        })
      });
      if (!res.ok) throw new Error("Failed to unpublish course");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
          <p className="text-gray-500 dark:text-gray-400 capitalize">{course.course_type} | {course.is_published ? "Published" : "Draft"}</p>
        </div>
        <div className="flex gap-4">
           {course.is_published ? (
             <button onClick={handleUnpublish} disabled={loading} className="px-6 py-2 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors">
               Revert to Draft
             </button>
           ) : (
             <button onClick={handlePublish} disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg">
               <Globe className="w-5 h-5" /> Publish Course
             </button>
           )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
           <h3 className="text-lg font-bold mb-4">Modules</h3>
           <p className="text-3xl font-black">{totalModules}</p>
           <p className="text-sm text-gray-500 mt-1">Required: {course.course_type === 'internship' ? '2-5' : '2-3'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
           <h3 className="text-lg font-bold mb-4">Lessons</h3>
           <p className="text-3xl font-black">{totalLessons}</p>
           <p className="text-sm text-gray-500 mt-1">Required: {course.course_type === 'internship' ? '10-15' : '5-8'}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
           <h3 className="text-lg font-bold mb-4">MCQs</h3>
           <p className="text-3xl font-black">{totalMCQs}</p>
           <p className="text-sm text-gray-500 mt-1">Required: Exactly 10</p>
        </div>
        {course.course_type === 'internship' && (
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
             <h3 className="text-lg font-bold mb-4">Tasks</h3>
             <p className="text-3xl font-black">{tasks.length}</p>
             <p className="text-sm text-gray-500 mt-1">Required: Exactly 3</p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-6">
         <h2 className="text-xl font-bold">Curriculum Outline</h2>
         <p className="text-gray-500 text-sm">To modify content, use the Modules and Lessons managers in the sidebar. This view is for structural review before publishing.</p>
         
         <div className="space-y-4">
           {curriculum.map((mod: any, index: number) => (
             <div key={mod.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-800/30">
               <h4 className="font-bold text-lg">Module {index + 1}: {mod.title}</h4>
               <ul className="mt-3 space-y-2 pl-4">
                 {mod.lessons?.map((l: any, lIndex: number) => (
                   <li key={l.id} className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                     Lesson {lIndex + 1}: {l.title}
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
