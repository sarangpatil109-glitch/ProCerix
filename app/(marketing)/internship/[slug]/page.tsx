import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Briefcase, CheckCircle } from "lucide-react";
import Link from "next/link";
import { PixelFireViewContent } from "@/components/meta-pixel/PixelFireViewContent";
import { InternshipEnrollButton } from "@/components/course/InternshipEnrollButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { internshipSchema, breadcrumbSchema } from "@/lib/seo";
import { Metadata } from "next";
import { APP_CONFIG } from "@/constants";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://procerix.com";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = await createClient();
  const { data: internship } = await supabase
    .from("internships")
    .select("title, description, category, price")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!internship) return { title: "Virtual Internship | ProCerix" };

  const desc =
    internship.description ||
    `Virtual internship in ${internship.title} by ${APP_CONFIG.name}. Complete practical tasks and earn a certificate.`;

  return {
    title: internship.title,
    description: desc,
    keywords: [internship.title, internship.category ?? "", "virtual internship", "internship certificate", APP_CONFIG.name].filter(Boolean),
    alternates: { canonical: `/internship/${slug}` },
    openGraph: {
      title: `${internship.title} | ${APP_CONFIG.name}`,
      description: desc,
      type: "article",
      url: `${BASE_URL}/internship/${slug}`,
      siteName: APP_CONFIG.name,
      images: [{ url: "/branding/logo.png", width: 1200, height: 630, alt: internship.title }],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${internship.title} | ${APP_CONFIG.name}`,
      description: desc,
      images: ["/branding/logo.png"],
    },
  };
}

export default async function InternshipDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = await createClient();

  const { data: internship } = await supabase
    .from("internships")
    .select("*, internship_tasks(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!internship) notFound();

  const tasks: any[] = (internship as any).internship_tasks || [];

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black py-16 px-4 sm:px-6 lg:px-8">
      <JsonLd data={internshipSchema({ title: internship.title, description: internship.description, slug: internship.slug ?? slug, price: internship.price, category: internship.category ?? undefined })} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Internships", url: "/internships" },
        { name: internship.title, url: `${BASE_URL}/internship/${internship.slug ?? slug}` },
      ])} />
      <PixelFireViewContent
        content_name={internship.title}
        content_category={internship.category ?? undefined}
        content_type="internship"
      />
      <div className="max-w-4xl mx-auto space-y-10">
        {/* Hero */}
        <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
            </div>
            <span className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">Virtual Internship</span>
          </div>

          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {internship.title}
          </h1>

          {internship.company_name && (
            <p className="text-gray-500 dark:text-gray-400 font-medium">{internship.company_name}</p>
          )}

          {internship.description && (
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              {internship.description}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black text-gray-900 dark:text-white">
              ₹{internship.price}
            </span>
            {internship.original_price > internship.price && (
              <span className="text-xl text-gray-400 line-through">₹{internship.original_price}</span>
            )}
            {internship.original_price > internship.price && (
              <span className="text-sm font-bold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-3 py-1 rounded-full">
                {Math.round(((internship.original_price - internship.price) / internship.original_price) * 100)}% OFF
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <InternshipEnrollButton
              slug={internship.slug ?? slug}
              price={internship.price}
              label={`Enroll Now — ₹${internship.price}`}
            />
            <Link
              href="/internships"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Browse All Internships
            </Link>
          </div>
        </div>

        {/* What you will do */}
        <div className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-3xl p-10 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">What You Will Do</h2>
          <div className="grid gap-4">
            {tasks.length > 0 ? (
              tasks
                .sort((a: any, b: any) => (a.sequence_order ?? 0) - (b.sequence_order ?? 0))
                .map((task: any, i: number) => (
                  <div key={task.id} className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <div className="w-8 h-8 flex-shrink-0 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-full flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                ))
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {["Practical industry tasks", "Real-world scenarios", "Mentor feedback", "Completion certificate"].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan-500 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
