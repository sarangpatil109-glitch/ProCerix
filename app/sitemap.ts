import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://procerix.com";

const STATIC_ROUTES: Array<{ path: string; priority: number; changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "",            priority: 1.0, changeFreq: "daily" },
  { path: "/search",     priority: 0.9, changeFreq: "daily" },
  { path: "/internships",priority: 0.9, changeFreq: "daily" },
  { path: "/certificates",priority: 0.8, changeFreq: "weekly" },
  { path: "/pricing",    priority: 0.8, changeFreq: "monthly" },
  { path: "/about",      priority: 0.7, changeFreq: "monthly" },
  { path: "/contact",    priority: 0.7, changeFreq: "monthly" },
  { path: "/faq",        priority: 0.7, changeFreq: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const now = new Date();

  // Static pages
  const staticUrls: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority, changeFreq }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: changeFreq,
    priority,
  }));

  // Published courses
  const { data: courses } = await (supabase as any)
    .from("courses")
    .select("slug, updated_at")
    .eq("is_published", true)
    .not("slug", "is", null) as { data: Array<{ slug: string; updated_at: string | null }> | null };

  const courseUrls: MetadataRoute.Sitemap = (courses || []).map((c) => ({
    url: `${BASE_URL}/course/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Published internships
  const { data: internships } = await (supabase as any)
    .from("internships")
    .select("slug, updated_at")
    .eq("is_published", true)
    .not("slug", "is", null) as { data: Array<{ slug: string; updated_at: string | null }> | null };

  const internshipUrls: MetadataRoute.Sitemap = (internships || []).map((i) => ({
    url: `${BASE_URL}/internship/${i.slug}`,
    lastModified: i.updated_at ? new Date(i.updated_at) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Certificate verification pages (public)
  const { data: certificates } = await (supabase as any)
    .from("certificates")
    .select("credential_id, issued_at")
    .not("credential_id", "is", null)
    .limit(500) as { data: Array<{ credential_id: string; issued_at: string | null }> | null };

  const certVerifyUrls: MetadataRoute.Sitemap = (certificates || []).map((cert) => ({
    url: `${BASE_URL}/verify/${cert.credential_id}`,
    lastModified: cert.issued_at ? new Date(cert.issued_at) : now,
    changeFrequency: "never" as const,
    priority: 0.5,
  }));

  return [...staticUrls, ...courseUrls, ...internshipUrls, ...certVerifyUrls];
}
