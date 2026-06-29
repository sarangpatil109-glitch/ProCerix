import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export function buildModulesQuery(client: SupabaseClient<Database>, courseId: string) {
  return (client as any)
    .from("learning_modules")
    .select("*, lessons(*), quizzes(*)")
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .is("lessons.deleted_at", null)
    .is("quizzes.deleted_at", null);
}

export function buildProgressQuery(client: SupabaseClient<Database>, enrollmentId: string) {
  return client
    .from("progress")
    .select("*")
    .eq("enrollment_id", enrollmentId);
}
