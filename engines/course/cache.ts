import { unstable_cache } from "next/cache";
import { CourseRepository } from "./repository";
import { createAdminClient } from "@/lib/supabase/admin";

export const getCachedCourseBySlug = unstable_cache(
  async (slug: string) => {
    const adminClient = createAdminClient();
    const repo = new CourseRepository(adminClient);
    return repo.getCourseBySlug(slug);
  },
  ["course-by-slug"],
  {
    revalidate: 3600,
    tags: ["courses"],
  }
);
