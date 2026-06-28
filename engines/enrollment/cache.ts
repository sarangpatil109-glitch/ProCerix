import { unstable_cache } from "next/cache";
import { EnrollmentRepository } from "./repository";
import { createAdminClient } from "@/lib/supabase/admin";

export const getCachedEnrollment = unstable_cache(
  async (userId: string, courseId: string) => {
    const adminClient = createAdminClient();
    const repo = new EnrollmentRepository(adminClient);
    return repo.getEnrollment(userId, courseId);
  },
  ["user-enrollment"],
  {
    revalidate: 60,
    tags: ["enrollments"],
  }
);
