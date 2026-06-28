import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { ModuleInput, LessonInput, ProgressInput } from "@/validators/learning";
import { buildModulesQuery, buildProgressQuery } from "./queries";

export class LearningRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getCourseContent(courseId: string) {
    const { data, error } = await buildModulesQuery(this.client, courseId);
    if (error) throw error;
    return data;
  }

  async createModule(input: ModuleInput) {
    const { data, error } = await this.client
      .from("learning_modules")
      .insert(input as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateModule(id: string, input: Partial<ModuleInput>) {
    const { data, error } = await this.client
      .from("learning_modules")
      .update({ ...input, updated_at: new Date().toISOString() } as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async softDeleteModule(id: string) {
    const { error } = await this.client
      .from("learning_modules")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) throw error;
  }

  async createLesson(input: LessonInput) {
    const { data, error } = await this.client
      .from("lessons")
      .insert(input as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateLesson(id: string, input: Partial<LessonInput>) {
    const { data, error } = await this.client
      .from("lessons")
      .update({ ...input, updated_at: new Date().toISOString() } as any)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async softDeleteLesson(id: string) {
    const { error } = await this.client
      .from("lessons")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) throw error;
  }

  async getUserProgress(enrollmentId: string) {
    const { data, error } = await buildProgressQuery(this.client, enrollmentId);
    if (error) throw error;
    return data;
  }

  async upsertProgress(input: ProgressInput) {
    const { data, error } = await this.client
      .from("progress")
      .upsert({
        enrollment_id: input.enrollment_id,
        lesson_id: input.lesson_id,
        is_completed: input.is_completed,
        completed_at: input.is_completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'enrollment_id, lesson_id' } as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}
