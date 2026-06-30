import { Metadata } from "next";
import { APP_CONFIG } from "@/constants";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://procerix.com";

export function generateCourseMetadata(
  course: {
    title: string;
    description?: string | null;
    category?: string | null;
    price?: number | null;
    slug?: string;
  },
  slug?: string
): Metadata {
  const courseSlug = slug ?? course.slug ?? "";
  const desc =
    course.description ||
    `Learn ${course.title} with ${APP_CONFIG.name} AI-powered certification. Earn a verifiable digital certificate.`;
  const keywords = [
    course.title,
    course.category,
    "certificate",
    "online course",
    "AI certification",
    APP_CONFIG.name,
  ].filter(Boolean) as string[];

  return {
    title: course.title,
    description: desc,
    keywords,
    alternates: {
      canonical: courseSlug ? `/course/${courseSlug}` : undefined,
    },
    openGraph: {
      title: `${course.title} | ${APP_CONFIG.name}`,
      description: desc,
      type: "article",
      url: courseSlug ? `${BASE_URL}/course/${courseSlug}` : BASE_URL,
      siteName: APP_CONFIG.name,
      images: [
        {
          url: "/branding/logo.png",
          width: 1200,
          height: 630,
          alt: course.title,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: `${course.title} | ${APP_CONFIG.name}`,
      description: desc,
      images: ["/branding/logo.png"],
    },
  };
}
