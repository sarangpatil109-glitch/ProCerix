import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export function buildQuizQuery(client: SupabaseClient<Database>, quizId: string) {
  return client
    .from("quizzes")
    .select("*, questions(*, options(*))")
    .eq("id", quizId)
    .single();
}

export function buildUserAttemptsQuery(client: SupabaseClient<Database>, enrollmentId: string, quizId: string) {
  return (client as any)
    .from("attempts")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .eq("quiz_id", quizId);
}
