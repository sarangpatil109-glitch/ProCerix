import Link from "next/link";
import { PlayCircle, Clock, CheckCircle } from "lucide-react";

export function EnrollmentCard({ enrollment }: { enrollment: any }) {
  const course = enrollment.courses;
  const isCompleted = enrollment.status === "completed";
  
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
      <div className="mb-4">
        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-3">
          {course.course_type}
        </span>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-snug">
          {course.title}
        </h3>
      </div>
      
      <div className="mt-auto pt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isCompleted ? (
             <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
             <Clock className="w-5 h-5 text-blue-500" />
          )}
          <span className={`text-sm font-medium ${isCompleted ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {isCompleted ? "Completed" : "In Progress"}
          </span>
        </div>
        
        <Link 
          href={`/learn/${course.slug}`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-blue-600 hover:text-white dark:bg-gray-800 dark:hover:bg-blue-600 text-gray-900 dark:text-white font-bold rounded-full transition-colors text-sm"
        >
          <PlayCircle className="w-4 h-4" /> 
          {isCompleted ? "Review" : "Continue"}
        </Link>
      </div>
    </div>
  );
}
