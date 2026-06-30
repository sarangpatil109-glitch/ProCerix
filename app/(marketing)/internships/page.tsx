import { createClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/search/course-card";
import { Zap } from "lucide-react";
import { Metadata } from "next";
import { APP_CONFIG } from "@/constants";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://procerix.com";

export const metadata: Metadata = {
  title: "Virtual Internships",
  description: "Explore AI-powered virtual internships on ProCerix. Complete practical industry tasks, earn an Experience Letter, and showcase real-world skills.",
  keywords: ["virtual internship", "online internship", "AI internship", "experience letter", "internship certificate", "ProCerix"],
  alternates: { canonical: "/internships" },
  openGraph: {
    title: `Virtual Internships | ${APP_CONFIG.name}`,
    description: "AI-powered virtual internships. Complete practical tasks, earn an Experience Letter and certificate.",
    url: `${BASE_URL}/internships`,
    siteName: APP_CONFIG.name,
    images: [{ url: "/branding/logo.png", width: 1200, height: 630, alt: `${APP_CONFIG.name} Virtual Internships` }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Virtual Internships | ${APP_CONFIG.name}`,
    description: "AI-powered virtual internships with practical tasks and verifiable certificates.",
    images: ["/branding/logo.png"],
  },
};

export default async function InternshipsPage() {
  const supabase = await createClient();
  const { data: internships } = await supabase
    .from("internships")
    .select("*")
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
          {internships?.map((internship: any) => (
            <CourseCard
              key={internship.id}
              course={{
                ...internship,
                course_type: "internship",
                isVirtualProduct: !!internship.slug,
                marketing_route: internship.slug ? `/internship/${internship.slug}` : "/internships",
              }}
            />
          ))}
          {!internships || internships.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-500 dark:text-gray-400 text-lg">
              No internships published yet. Check back soon!
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
