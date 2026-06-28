import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/search/course-card";
import { Zap } from "lucide-react";

export default async function InternshipsPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("course_type", "internship")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="py-24 px-6 bg-[#FAFAFA] dark:bg-black min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-16 h-16 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-3xl flex items-center justify-center">
             <Zap className="w-8 h-8" />
           </div>
           <div>
             <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">Virtual Internships</h1>
             <p className="text-gray-500 dark:text-gray-400 text-lg mt-1">Build real-world experience through capstone tasks and earn an Experience Letter.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses?.map((course: any) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {!courses || courses.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 dark:text-gray-400 text-lg">
              No internships published yet. Use the search to generate one!
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
