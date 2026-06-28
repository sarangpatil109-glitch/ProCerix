import Link from "next/link";
import { Clock, Tag } from "lucide-react";
import { CourseRow } from "@/engines/course/types";

export function CourseCard({ course }: { course: CourseRow & { duration_minutes?: number, course_type?: string, isVirtualProduct?: boolean, marketing_route?: string } }) {
  const href = course.isVirtualProduct ? course.marketing_route : `/course/${course.slug}`;
  return (
    <Link href={href || "#"} className="group block h-full">
      <div className="relative flex flex-col h-full bg-white dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
        
        <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors duration-300" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/90 dark:bg-black/90 text-gray-900 dark:text-gray-100 backdrop-blur-sm shadow-sm capitalize">
              {course.difficulty}
            </span>
            {course.course_type && (
              <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/90 text-white backdrop-blur-sm shadow-sm capitalize flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {course.course_type}
              </span>
            )}
          </div>
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {course.title}
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-6 flex-grow">
            {course.description || "No description provided."}
          </p>

          <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              {course.duration_minutes ? (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Self-paced
                </span>
              )}
            </div>
            
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {(course.price ?? 0) > 0 ? `₹${course.price}` : "Free"}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
