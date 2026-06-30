import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

export async function initializeProgressRecords(
  client: SupabaseClient<Database>, 
  enrollmentId: string, 
  courseId: string
) {
  const { data: modules, error: modErr } = await (client as any)
    .from("learning_modules")
    .select("id, lessons(id)")
    .eq("course_id", courseId)
    .is("deleted_at", null)
    .is("lessons.deleted_at", null);
    
  if (modErr || !modules) return;

  const inserts: { enrollment_id: string, lesson_id: string, is_completed: boolean }[] = [];
  
  for (const courseModule of modules) {
    for (const lesson of courseModule.lessons) {
      inserts.push({
        enrollment_id: enrollmentId,
        lesson_id: lesson.id,
        is_completed: false,
      });
    }
  }

  if (inserts.length > 0) {
    await client.from("progress").insert(inserts as any);
  }
}
