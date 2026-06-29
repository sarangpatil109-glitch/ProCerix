"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle2, Circle, PlayCircle, FileText, ClipboardList } from "lucide-react";

export function LearnSidebar({ 
  course, 
  curriculum,
  progress,
  enrollmentId 
}: { 
  course: any, 
  curriculum: any[],
  progress: any[],
  enrollmentId: string
}) {
  const params = useParams();
  const currentLessonId = params.lessonId as string | undefined;
  const currentQuizId = params.quizId as string | undefined;

  const getProgress = (lessonId: string) => {
    return progress.find((p) => p.lesson_id === lessonId)?.is_completed;
  };

  return (
    <div className="w-full md:w-80 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <Link href={`/course/${course.slug}`} className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2 block hover:underline">
          &larr; Back to Course
        </Link>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
          {course.title}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {curriculum.map((module, index) => (
          <div key={module.id} className="space-y-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider px-2">
              Module {index + 1}: {module.title}
            </h3>
            <div className="space-y-1">
              {module.lessons?.map((lesson: any) => {
                const isActive = currentLessonId === lesson.id;
                const isCompleted = getProgress(lesson.id);

                return (
                  <Link
                    key={lesson.id}
                    href={`/learn/${course.slug}/${lesson.id}`}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      ) : (
                        <Circle className={`w-5 h-5 ${isActive ? "text-blue-500" : "text-gray-300 dark:text-gray-600"}`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm leading-snug">{lesson.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 opacity-60">
                        {lesson.video_url ? <PlayCircle className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                        <span className="text-xs">{lesson.video_url ? "Video" : "Article"}</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
              {(module.quizzes as any[] | undefined)?.filter((q: any) => !q.deleted_at).map((quiz: any) => {
                const isActive = currentQuizId === quiz.id;
                return (
                  <Link
                    key={quiz.id}
                    href={`/learn/${course.slug}/quiz/${quiz.id}`}
                    className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      <ClipboardList className={`w-5 h-5 ${isActive ? "text-orange-500" : "text-orange-400"}`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm leading-snug">{quiz.title}</p>
                      <div className="flex items-center gap-1.5 mt-1 opacity-60">
                        <span className="text-xs">Module Quiz</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
