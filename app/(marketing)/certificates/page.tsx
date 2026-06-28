import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/search/course-card";
import { ShieldCheck } from "lucide-react";

export default async function CertificatesPage() {
  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .eq("course_type", "certificate")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="py-24 px-6 bg-[#FAFAFA] dark:bg-black min-h-screen">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex items-center gap-4 mb-8">
           <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center">
             <ShieldCheck className="w-8 h-8" />
           </div>
           <div>
             <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter">Skill Certificates</h1>
             <p className="text-gray-500 dark:text-gray-400 text-lg mt-1">Master a specific domain with focused modules and earn a verifiable credential.</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses?.map((course: any) => (
            <CourseCard key={course.id} course={course} />
          ))}
          {!courses || courses.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 dark:text-gray-400 text-lg">
              No certificates published yet. Use the search to generate one!
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
