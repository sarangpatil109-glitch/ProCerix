import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { CreateEnrollmentInput } from "@/validators/enrollment";
import { buildUserEnrollmentsQuery, buildEnrollmentQuery } from "./queries";
import { initializeProgressRecords } from "./progress-init";

export class EnrollmentRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async getUserEnrollments(userId: string) {
    const { data, error } = await buildUserEnrollmentsQuery(this.client, userId);
    if (error) throw error;
    return data;
  }

  async getEnrollment(userId: string, courseId: string) {
    const { data, error } = await buildEnrollmentQuery(this.client, userId, courseId);
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async getEnrollmentById(id: string) {
    const { data, error } = await this.client
      .from("enrollments")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  }

  async createEnrollment(input: CreateEnrollmentInput & { status: string }) {
    const existing = await this.getEnrollment(input.user_id, input.course_id);
    if (existing) return existing;

    const { data, error } = await this.client
      .from("enrollments")
      .insert(input as any)
      .select()
      .single();
      
    if (error) throw error;
    
    initializeProgressRecords(this.client, data.id, input.course_id).catch(console.error);
    
    return data;
  }

  async updateEnrollmentStatus(id: string, status: string) {
    const { data, error } = await this.client
      .from("enrollments")
      .update({ status: status as any })
      .eq("id", id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
}
