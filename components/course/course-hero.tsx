import { Clock, BarChart, Tag, Award } from "lucide-react";

export function CourseHero({ course }: { course: any }) {
  return (
    <div className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8 border-b border-gray-800">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 capitalize flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {course.course_type || "Course"}
            </span>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-800 text-gray-300 border border-gray-700">
              {course.category || "General"}
            </span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            {course.title}
          </h1>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
            {course.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-300">
            <div className="flex items-center gap-2">
              <BarChart className="w-5 h-5 text-blue-400" />
              <span className="capitalize">{course.difficulty} Level</span>
            </div>
            {course.duration_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span>{Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-400" />
              <span>Certificate of Completion</span>
            </div>
          </div>
        </div>
        
        {/* Decorative Hero Image / Video Placeholder */}
        <div className="hidden lg:block relative h-full min-h-[400px] w-full rounded-3xl overflow-hidden border border-gray-800 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/50 to-gray-900/80 z-10" />
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
             <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md z-20 shadow-lg cursor-pointer hover:scale-105 transition-transform">
               <div className="w-0 h-0 border-t-[12px] border-t-transparent border-l-[20px] border-l-white border-b-[12px] border-b-transparent ml-2" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
