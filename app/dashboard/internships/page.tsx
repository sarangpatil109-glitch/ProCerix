import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Briefcase, ArrowRight } from "lucide-react";

export default async function DashboardInternships() {
  const supabase = await createClient();

  const { data: internships } = await supabase
    .from("internships")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">My Internships</h1>
        <p className="text-gray-500 dark:text-gray-400">Complete tasks and build real-world experience.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {internships?.map((internship: any) => (
          <Link
            key={internship.id}
            href={internship.slug ? `/internship/${internship.slug}` : "/internships"}
            className="group block"
          >
            <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {internship.title}
                  </h3>
                  {internship.company_name && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{internship.company_name}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">₹{internship.price}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-500 transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {!internships || internships.length === 0 ? (
          <div className="col-span-full p-8 text-center text-gray-500">
            No internships available yet. <Link href="/internships" className="text-cyan-600 underline">Browse internships</Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
