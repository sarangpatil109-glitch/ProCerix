import Link from "next/link";
import { Clock, Tag } from "lucide-react";
import { CourseRow } from "@/engines/course/types";

import { BannerGenerator } from "@/components/course/banner-generator";
import { ProductRegistry } from "@/engines/registry/product-registry";

function HighlightText({ text, query }: { text: string, query?: string }) {
  if (!query || !text) return <>{text}</>;
  
  // Extract simple keywords from query to highlight
  const words = query.trim().split(/\s+/).filter(w => w.length > 2);
  if (words.length === 0) return <>{text}</>;
  
  const regex = new RegExp(`(${words.join("|")})`, "gi");
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, i) => 
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit rounded-sm px-0.5">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function CourseCard({ course, searchQuery }: { course: CourseRow & { duration_minutes?: number, course_type?: string, isVirtualProduct?: boolean, marketing_route?: string }, searchQuery?: string }) {
  const href = course.isVirtualProduct ? course.marketing_route : `/course/${course.slug}`;
  return (
    <Link href={href || "#"} className="group block h-full">
      <div className="relative flex flex-col h-full bg-white dark:bg-gray-900/40 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1">
        
        <div className="h-48 w-full relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
          <BannerGenerator 
            title={course.title} 
            category={course.category || course.course_type} 
            difficulty={course.difficulty} 
            size="sm" 
          />
          <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/10 transition-colors duration-300" />
        </div>

        <div className="p-6 flex flex-col flex-grow">
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <HighlightText text={course.title} query={searchQuery} />
          </h3>
          
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-6 flex-grow">
            <HighlightText text={course.description || "No description provided."} query={searchQuery} />
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
            
            <div className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{(course.price ?? 0) > 0 ? `₹${course.price}` : "Free"}</span>
              {(course.price ?? 0) > 0 && (
                <span className="text-sm text-gray-500 line-through font-normal">
                  ₹{(course as any).original_price || ProductRegistry.getProduct((course.course_type as any) || "certificate")?.originalPrice || 499}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
