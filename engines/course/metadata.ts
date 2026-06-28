import { Metadata } from "next";
import { CourseRow } from "./types";
import { APP_CONFIG } from "@/constants";

export function generateCourseMetadata(course: CourseRow): Metadata {
  return {
    title: course.title,
    description: course.description || `Learn about ${course.title} on ${APP_CONFIG.name}.`,
    openGraph: {
      title: course.title,
      description: course.description || `Learn about ${course.title} on ${APP_CONFIG.name}.`,
      type: "website",
      siteName: APP_CONFIG.name,
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description: course.description || `Learn about ${course.title} on ${APP_CONFIG.name}.`,
    },
  };
}
