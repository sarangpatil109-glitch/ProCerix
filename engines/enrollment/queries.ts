import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export function buildUserEnrollmentsQuery(client: SupabaseClient<Database>, userId: string) {
  return client
    .from("enrollments")
    .select("*, courses(*)")
    .eq("user_id", userId);
}

export function buildEnrollmentQuery(client: SupabaseClient<Database>, userId: string, courseId: string) {
  return client
    .from("enrollments")
    .select("*")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .single();
}
