"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, Circle } from "lucide-react";
import { updateProgressAction } from "@/actions/learning";
import { issueCertificateAction } from "@/actions/certificate";

export function LessonNavigation({
  courseSlug,
  enrollmentId,
  lessonId,
  isCompleted,
  prevLessonId,
  nextLessonId,
  userId,
  courseId
}: {
  courseSlug: string;
  enrollmentId: string;
  lessonId: string;
  isCompleted: boolean;
  prevLessonId: string | null;
  nextLessonId: string | null;
  userId: string;
  courseId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [certSuccess, setCertSuccess] = useState<string | null>(null);

  const toggleComplete = async () => {
    setLoading(true);
    await updateProgressAction({
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      is_completed: !isCompleted
    });
    setLoading(false);
    
    if (!isCompleted && nextLessonId) {
      router.push(`/learn/${courseSlug}/${nextLessonId}`);
    } else if (!isCompleted && !nextLessonId) {
      // Auto-trigger certificate if last lesson
      handleCertificate();
    } else {
      router.refresh();
    }
  };

  const handleCertificate = async () => {
    setLoading(true);
    const res = await issueCertificateAction(userId, courseId);
    if (res.credentialId) {
      setCertSuccess(res.credentialId);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-gray-200 dark:border-gray-800 mt-12 relative">
      {certSuccess && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-green-100 text-green-800 px-6 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 whitespace-nowrap">
          <CheckCircle2 className="w-5 h-5" />
          Certificate Earned! 
          <a href={`/verify/${certSuccess}`} className="underline text-green-900 ml-2" target="_blank" rel="noreferrer">View Certificate</a>
        </div>
      )}
      <div>
        {prevLessonId && (
          <button
            onClick={() => router.push(`/learn/${courseSlug}/${prevLessonId}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous Lesson
          </button>
        )}
      </div>

      <button
        onClick={toggleComplete}
        disabled={loading}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm shadow-sm transition-all ${
          isCompleted 
            ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700" 
            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/30 hover:shadow-lg"
        }`}
      >
        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
        {isCompleted ? "Completed" : "Mark as Complete"}
      </button>

      <div>
        {nextLessonId && (
          <button
            onClick={() => router.push(`/learn/${courseSlug}/${nextLessonId}`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
             Next Lesson <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
